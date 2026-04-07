def get_priority(report_count: int) -> str:
    if report_count >= 5:
        return "High"
    elif report_count >= 2:
        return "Medium"
    return "Low"