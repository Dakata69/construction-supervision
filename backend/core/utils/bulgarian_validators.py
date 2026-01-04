"""
Bulgarian Business ID Validators
Validates BULSTAT, VAT, and EGN (personal ID) numbers with checksums
"""


def validate_bulstat(bulstat):
    """
    Validate Bulgarian BULSTAT number (9 or 13 digits)
    Returns (is_valid, message)
    """
    if not bulstat:
        return False, "BULSTAT не може да бъде празен"
    
    # Remove any spaces or dashes
    bulstat = str(bulstat).replace(' ', '').replace('-', '')
    
    if not bulstat.isdigit():
        return False, "BULSTAT трябва да съдържа само цифри"
    
    if len(bulstat) not in [9, 13]:
        return False, "BULSTAT трябва да бъде 9 или 13 цифри"
    
    # Validate 9-digit BULSTAT
    weights_9 = [1, 2, 3, 4, 5, 6, 7, 8]
    weights_9_alt = [3, 4, 5, 6, 7, 8, 9, 10]
    
    digits = [int(d) for d in bulstat[:9]]
    
    # Calculate checksum
    checksum = sum(d * w for d, w in zip(digits[:8], weights_9)) % 11
    if checksum == 10:
        checksum = sum(d * w for d, w in zip(digits[:8], weights_9_alt)) % 11
        if checksum == 10:
            checksum = 0
    
    if checksum != digits[8]:
        return False, "Невалиден BULSTAT - грешна контролна сума"
    
    # If 13 digits, validate the additional checksum
    if len(bulstat) == 13:
        weights_13 = [2, 7, 3, 5]
        weights_13_alt = [4, 9, 5, 7]
        
        checksum_13 = sum(d * w for d, w in zip(digits[8:12], weights_13)) % 11
        if checksum_13 == 10:
            checksum_13 = sum(d * w for d, w in zip(digits[8:12], weights_13_alt)) % 11
            if checksum_13 == 10:
                checksum_13 = 0
        
        if checksum_13 != int(bulstat[12]):
            return False, "Невалиден 13-цифрен BULSTAT - грешна контролна сума"
    
    return True, f"Валиден {len(bulstat)}-цифрен BULSTAT"


def validate_vat_number(vat):
    """
    Validate Bulgarian VAT number (must start with BG followed by 9 or 10 digits)
    Returns (is_valid, message)
    """
    if not vat:
        return False, "ДДС номер не може да бъде празен"
    
    vat = str(vat).upper().replace(' ', '').replace('-', '')
    
    if not vat.startswith('BG'):
        return False, "ДДС номер трябва да започва с 'BG'"
    
    number = vat[2:]
    
    if not number.isdigit():
        return False, "ДДС номер трябва да съдържа само цифри след 'BG'"
    
    if len(number) == 9:
        # It's a BULSTAT
        is_valid, message = validate_bulstat(number)
        if is_valid:
            return True, "Валиден ДДС номер (BULSTAT)"
        return False, f"Невалиден ДДС номер: {message}"
    elif len(number) == 10:
        # It's a personal ID (EGN)
        is_valid, message = validate_personal_id(number)
        if is_valid:
            return True, "Валиден ДДС номер (ЕГН)"
        return False, f"Невалиден ДДС номер: {message}"
    else:
        return False, "ДДС номер трябва да бъде 9 или 10 цифри след 'BG'"


def validate_personal_id(egn):
    """
    Validate Bulgarian personal identification number (EGN - 10 digits)
    Returns (is_valid, message)
    """
    if not egn:
        return False, "ЕГН не може да бъде празно"
    
    egn = str(egn).replace(' ', '').replace('-', '')
    
    if not egn.isdigit():
        return False, "ЕГН трябва да съдържа само цифри"
    
    if len(egn) != 10:
        return False, "ЕГН трябва да бъде точно 10 цифри"
    
    digits = [int(d) for d in egn]
    
    # Extract date components
    year = digits[0] * 10 + digits[1]
    month = digits[2] * 10 + digits[3]
    day = digits[4] * 10 + digits[5]
    
    # Determine century and adjust year
    if month > 40:
        year += 2000
        month -= 40
    elif month > 20:
        year += 1800
        month -= 20
    else:
        year += 1900
    
    # Validate date
    try:
        from datetime import date
        birth_date = date(year, month, day)
    except ValueError:
        return False, "ЕГН съдържа невалидна дата на раждане"
    
    # Validate checksum
    weights = [2, 4, 8, 5, 10, 9, 7, 3, 6]
    checksum = sum(d * w for d, w in zip(digits[:9], weights)) % 11
    if checksum == 10:
        checksum = 0
    
    if checksum != digits[9]:
        return False, "Невалидно ЕГН - грешна контролна сума"
    
    return True, f"Валидно ЕГН (дата на раждане: {birth_date.strftime('%d.%m.%Y')})"
