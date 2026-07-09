from ..utils.bmi import bmi_category, calculate_bmi


def predict_health_risk(age: int, height: float, weight: float) -> dict:
    bmi = calculate_bmi(weight_kg=weight, height_cm=height)
    category = bmi_category(bmi)

    risk_score = 0
    if bmi >= 30:
        risk_score += 55
    elif bmi >= 25:
        risk_score += 35
    elif bmi < 18.5:
        risk_score += 20

    if age >= 45:
        risk_score += 20
    elif age >= 30:
        risk_score += 10

    risk_score = min(risk_score, 100)

    if risk_score >= 70:
        obesity_risk = "high"
    elif risk_score >= 40:
        obesity_risk = "medium"
    else:
        obesity_risk = "low"

    return {
        "bmi": bmi,
        "health_category": category,
        "obesity_risk": obesity_risk,
        "risk_score": risk_score,
    }
