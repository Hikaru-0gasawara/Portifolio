"""Privacy checks shared by the optional local résumé preparation scripts."""
import re

# Detect Brazilian numbers without retaining a real contact number in the repo.
# Accept country/area codes, optional mobile digit, and common separators.
PHONE = re.compile(r'(?<!\d)(?:\+?55[\s().-]*)?[1-9]\d[\s().-]*(?:9[\s().-]*)?[2-9]\d{3}[\s().-]*\d{4}(?!\d)')

def has_phone(value):
    return bool(PHONE.search(value))
