#!/usr/bin/env python3
"""
Mission43 – Salesforce MobilePhone Normalization Audit
-------------------------------------------------------

Purpose:
Audit exported Salesforce Contact data to ensure MobilePhone values:

1. Contain exactly 10 digits (US standard, no country code)
2. Do NOT start with 0 or 1
3. Contain only digits after normalization

This script is NON-DESTRUCTIVE.
It does NOT modify the source CSV.
It produces:
  - A detailed audit CSV
  - A summary report printed to console

Recommended usage:
  python3 tools/sf_mobile_normalization_audit.py \
      --input "/path/to/contacts.csv" \
      --output-dir "/Users/spencerwidman/mission43-form-core/Working SF Contact info"
"""

import csv
import os
import re
import argparse
from datetime import datetime

import hashlib
import os


# ------------------------------------------------------------
# Normalization Helpers
# ------------------------------------------------------------

def digits_only(value: str) -> str:
    """Remove all non-digit characters."""
    if not value:
        return ""
    return re.sub(r"\D", "", value)


def is_valid_us_mobile(digits: str) -> bool:
    """
    Validates US 10-digit mobile number rules:
    - Exactly 10 digits
    - Does not start with 0 or 1
    """
    if len(digits) != 10:
        return False
    if digits[0] in ("0", "1"):
        return False
    return True


def is_obviously_fake_number(digits: str) -> bool:
    """
    Detect clearly fake/test numbers:
    - All digits identical (e.g., 1111111111)
    - Sequential patterns (1234567890, 0123456789)
    - 555-01xx fictional block
    """
    if not digits or len(digits) != 10:
        return False

    if digits == digits[0] * 10:
        return True

    if digits in ("1234567890", "0123456789"):
        return True

    if digits.startswith("55501"):
        return True

    return False


def has_invalid_npa_nxx(digits: str) -> bool:
    """
    Conservative NANP validation:
    - NPA (area code) cannot start with 0 or 1
    - NPA second digit cannot be 9
    - NPA cannot be 000 or 911
    - NXX (exchange) cannot start with 0 or 1
    - NXX cannot be 000
    - NXX cannot be N11 (e.g., 211, 311, 911)
    """
    if len(digits) != 10:
        return True

    npa = digits[:3]
    nxx = digits[3:6]

    if npa[0] in ("0", "1"):
        return True

    if npa[1] == "9":
        return True

    if npa in ("000", "911"):
        return True

    if nxx[0] in ("0", "1"):
        return True

    if nxx == "000":
        return True

    if nxx[1:] == "11":
        return True

    return False


def is_555_exchange(digits: str) -> bool:
    """Detect 555 exchanges."""
    if len(digits) != 10:
        return False
    return digits[3:6] == "555"


def generate_backup_hash(record_id: str, original: str, normalized: str, final: str) -> str:
    """
    Generate deterministic SHA-256 hash for audit integrity.
    Salt can be overridden with environment variable M43_HASH_SALT.
    """
    salt = os.getenv("M43_HASH_SALT", "M43_DEFAULT_SALT")
    payload = f"{salt}|{record_id}|{original}|{normalized}|{final}"
    return hashlib.sha256(payload.encode("utf-8")).hexdigest()


# ------------------------------------------------------------
# Audit Logic
# ------------------------------------------------------------

def audit_file(input_path: str, output_dir: str):
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")

    # Define structured output directories
    audit_dir = os.path.join(output_dir, "Audit Files")
    import_dir = os.path.join(output_dir, "Import Files")

    os.makedirs(audit_dir, exist_ok=True)
    os.makedirs(import_dir, exist_ok=True)

    audit_output_path = os.path.join(
        audit_dir,
        f"mobile_normalization_AUDIT_{timestamp}.csv"
    )

    full_import_path = os.path.join(
        import_dir,
        f"mobile_normalization_FULL_{timestamp}.csv"
    )

    changed_only_path = os.path.join(
        audit_dir,
        f"mobile_normalization_CHANGED_ONLY_{timestamp}.csv"
    )

    summary_log_path = os.path.join(
        audit_dir,
        f"mobile_normalization_SUMMARY_{timestamp}.txt"
    )

    total = 0
    valid = 0
    invalid = 0

    reason_counter = {}

    os.makedirs(output_dir, exist_ok=True)

    # Salesforce exports are frequently Windows-1252 encoded.
    # Use latin-1 to guarantee no decode failures.
    infile_handle = open(input_path, newline='', encoding='latin-1', errors='strict')

    with infile_handle as infile, \
         open(audit_output_path, 'w', newline='', encoding='utf-8') as audit_file, \
         open(full_import_path, 'w', newline='', encoding='utf-8') as full_file, \
         open(changed_only_path, 'w', newline='', encoding='utf-8') as changed_file:

        reader = csv.DictReader(infile)

        audit_fieldnames = reader.fieldnames + [
            "OriginalMobile",
            "NormalizedMobile",
            "DigitLength",
            "ContainsNonDigitCharacters",
            "StartsWithZeroOrOne",
            "IsExactly10Digits",
            "IsValidUS10Digit",
            "IsElevenDigitsLeadingOne",
            "CanAutoCorrectByStrippingLeadingOne",
            "SuggestedNormalizedAfterStrip",
            "ValidationReason",
            "IsObviouslyFake",
            "HasInvalidNPAorNXX",
            "Is555Exchange",
            "BackupHash"
        ]

        audit_writer = csv.DictWriter(audit_file, fieldnames=audit_fieldnames)
        audit_writer.writeheader()

        full_writer = csv.DictWriter(full_file, fieldnames=reader.fieldnames)
        full_writer.writeheader()

        changed_writer = csv.DictWriter(changed_file, fieldnames=reader.fieldnames)
        changed_writer.writeheader()

        for row in reader:
            total += 1

            raw_mobile = row.get("Mobile", "") or ""
            normalized = digits_only(raw_mobile)

            digit_length = len(normalized)
            contains_non_digit = normalized != raw_mobile
            starts_zero_or_one = digit_length > 0 and normalized[0] in ("0", "1")

            is_exactly_10 = digit_length == 10
            is_valid = is_valid_us_mobile(normalized)

            is_fake = is_obviously_fake_number(normalized)
            invalid_npa_nxx = has_invalid_npa_nxx(normalized)
            is_555 = is_555_exchange(normalized)

            is_eleven_leading_one = digit_length == 11 and normalized.startswith("1")
            can_autocorrect_strip_one = False
            suggested_after_strip = ""

            validation_reason = []

            if is_valid:
                validation_reason.append("Valid 10-digit US number")
            else:
                if digit_length == 0:
                    validation_reason.append("Empty after normalization")
                if digit_length != 10:
                    validation_reason.append(f"Length {digit_length} (not 10)")
                if starts_zero_or_one and digit_length == 10:
                    validation_reason.append("Starts with 0 or 1")
                if is_eleven_leading_one:
                    validation_reason.append("11 digits with leading 1 (candidate for strip)")
                    stripped = normalized[1:]
                    suggested_after_strip = stripped
                    if is_valid_us_mobile(stripped):
                        can_autocorrect_strip_one = True
                        validation_reason.append("Becomes valid after stripping leading 1")

            validation_reason_str = "; ".join(validation_reason)

            # Track validation reason counts
            if validation_reason_str not in reason_counter:
                reason_counter[validation_reason_str] = 0
            reason_counter[validation_reason_str] += 1

            if is_valid:
                valid += 1
            else:
                invalid += 1

            # ------------------------------------------------------------
            # SAFE AUTO-CORRECTION LOGIC FOR IMPORT FILE
            # ------------------------------------------------------------
            final_mobile = normalized

            if digit_length == 11 and normalized.startswith("1"):
                stripped = normalized[1:]
                if is_valid_us_mobile(stripped):
                    final_mobile = stripped

            # Write audit record
            audit_writer.writerow({
                **row,
                "OriginalMobile": raw_mobile,
                "NormalizedMobile": normalized,
                "DigitLength": digit_length,
                "ContainsNonDigitCharacters": contains_non_digit,
                "StartsWithZeroOrOne": starts_zero_or_one,
                "IsExactly10Digits": is_exactly_10,
                "IsValidUS10Digit": is_valid,
                "IsElevenDigitsLeadingOne": is_eleven_leading_one,
                "CanAutoCorrectByStrippingLeadingOne": can_autocorrect_strip_one,
                "SuggestedNormalizedAfterStrip": suggested_after_strip,
                "ValidationReason": validation_reason_str,
                "IsObviouslyFake": is_fake,
                "HasInvalidNPAorNXX": invalid_npa_nxx,
                "Is555Exchange": is_555,
                "BackupHash": generate_backup_hash(
                    row.get("Id", ""),
                    raw_mobile,
                    normalized,
                    final_mobile
                ),
            })

            normalized_row = dict(row)
            normalized_row["Mobile"] = final_mobile
            full_writer.writerow(normalized_row)

            # Write changed-only file
            if final_mobile != digits_only(raw_mobile):
                changed_writer.writerow(normalized_row)

    # Console summary
    print("\n--- Salesforce MobilePhone Normalization Audit ---")
    print(f"Input File: {input_path}")
    print(f"Audit File: {audit_output_path}")
    print(f"Full Import File: {full_import_path}")
    print(f"Changed-Only File: {changed_only_path}")
    print(f"Total Records: {total}")
    print(f"Valid 10-digit US Mobiles: {valid}")
    print(f"Invalid Mobiles: {invalid}")
    print("---------------------------------------------------\n")

    # ------------------------------------------------------------
    # Write human-readable summary log
    # ------------------------------------------------------------
    with open(summary_log_path, "w", encoding="utf-8") as summary_file:
        summary_file.write("Mission43 Salesforce MobilePhone Normalization Audit\n")
        summary_file.write("=====================================================\n\n")
        summary_file.write(f"Input File: {input_path}\n")
        summary_file.write(f"Audit File: {audit_output_path}\n")
        summary_file.write(f"Full Import File: {full_import_path}\n")
        summary_file.write(f"Changed-Only File: {changed_only_path}\n")
        summary_file.write(f"Summary Log File: {summary_log_path}\n\n")
        summary_file.write(f"Total Records: {total}\n")
        summary_file.write(f"Valid 10-digit US Mobiles: {valid}\n")
        summary_file.write(f"Invalid Mobiles: {invalid}\n\n")

        summary_file.write("Breakdown by Validation Reason:\n")
        summary_file.write("--------------------------------\n")

        for reason, count in sorted(reason_counter.items(), key=lambda x: x[1], reverse=True):
            summary_file.write(f"{count:6}  {reason}\n")

    print(f"Summary Log File: {summary_log_path}")


# ------------------------------------------------------------
# CLI Entry
# ------------------------------------------------------------

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Audit Salesforce MobilePhone normalization.")
    parser.add_argument("--input", required=True, help="Path to exported Salesforce CSV file.")
    parser.add_argument("--output-dir", required=True, help="Directory to write audit output.")

    args = parser.parse_args()

    audit_file(args.input, args.output_dir)
