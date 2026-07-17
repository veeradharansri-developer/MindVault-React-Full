def sanitize_to_ascii(text: str) -> str:
    """
    Sanitizes string to convert common non-ASCII characters to their nearest
    ASCII equivalents, and drops any remaining non-ASCII characters to prevent
    UnicodeEncodeErrors in environments defaulting to ASCII locales.
    """
    if not text:
        return ""
    # Map common unicode characters to ascii equivalents
    replacements = {
        "\u2014": "-",  # em-dash
        "\u2013": "-",  # en-dash
        "\u201c": '"',  # left curly double quote
        "\u201d": '"',  # right curly double quote
        "\u2018": "'",  # left curly single quote
        "\u2019": "'",  # right curly single quote
        "\u2022": "*",  # bullet point
        "\u00a0": " ",  # non-breaking space
    }
    for old, new in replacements.items():
        text = text.replace(old, new)
    # Remove any other non-ascii character
    return text.encode("ascii", errors="ignore").decode("ascii")
