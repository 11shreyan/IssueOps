def classify_issue(description: str) -> str:
    desc = description.lower()

    if any(word in desc for word in ["light", "fan", "power", "switch"]):
        return "Electrical"

    elif any(word in desc for word in ["water", "leak", "pipe", "tap"]):
        return "Plumbing"

    elif any(word in desc for word in ["wifi", "internet", "network"]):
        return "IT"

    elif any(word in desc for word in ["garbage", "clean", "dirty"]):
        return "Sanitation"

    return "General"