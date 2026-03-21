from urllib.parse import parse_qs, urlsplit

from app.services.payment import vnpay


def test_build_payment_url_contains_secure_hash(monkeypatch):
    monkeypatch.setattr(vnpay.settings, "VNPAY_TMN_CODE", "TESTTMN")
    monkeypatch.setattr(vnpay.settings, "VNPAY_HASH_SECRET", "SECRETKEY")
    monkeypatch.setattr(
        vnpay.settings,
        "VNPAY_PAYMENT_URL",
        "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html",
    )
    monkeypatch.setattr(
        vnpay.settings,
        "VNPAY_RETURN_URL",
        "http://localhost:8000/api/v1/payments/vnpay/return",
    )

    payment_url = vnpay.build_payment_url(
        order_id=123,
        amount_vnd=150000,
        order_info="Thanh toan don #123",
        client_ip="127.0.0.1",
    )

    parsed = urlsplit(payment_url)
    params = parse_qs(parsed.query)

    assert parsed.scheme == "https"
    assert params["vnp_TmnCode"][0] == "TESTTMN"
    assert params["vnp_Amount"][0] == "15000000"
    assert "vnp_SecureHash" in params


def test_verify_return_params_success(monkeypatch):
    monkeypatch.setattr(vnpay.settings, "VNPAY_HASH_SECRET", "SECRETKEY")

    payload = {
        "vnp_Amount": "15000000",
        "vnp_Command": "pay",
        "vnp_ResponseCode": "00",
        "vnp_TransactionStatus": "00",
        "vnp_TmnCode": "TESTTMN",
        "vnp_TxnRef": "123_20260321090000",
    }

    sign_data = vnpay._build_sign_data(payload)
    secure_hash = vnpay._hmac_sha512(sign_data, "SECRETKEY")
    payload["vnp_SecureHash"] = secure_hash

    assert vnpay.verify_return_params(payload) is True


def test_extract_order_id():
    assert vnpay.extract_order_id("123_20260321090000") == 123
    assert vnpay.extract_order_id("abc_20260321090000") is None
    assert vnpay.extract_order_id("") is None
