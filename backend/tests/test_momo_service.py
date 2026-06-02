import hashlib
import hmac

import pytest

from app.services.payment import momo


def test_extract_order_id():
    assert momo.extract_order_id("42_20260602120000") == 42
    assert momo.extract_order_id("abc_20260602120000") is None


def test_build_momo_order_id_contains_order_id():
    oid = momo.build_momo_order_id(99)
    assert oid.startswith("99_")


def test_verify_return_signature(monkeypatch):
    monkeypatch.setattr(momo.settings, "MOMO_ACCESS_KEY", "klm05TvNBzhg7h7j")
    monkeypatch.setattr(momo.settings, "MOMO_SECRET_KEY", "at67qH6mk8w5Y1nAyMoYKMWACiEi2bsa")

    payload = {
        "partnerCode": "MOMOBKUN20180529",
        "orderId": "673_20260602231442",
        "requestId": "673_20260602231442",
        "amount": "5910000",
        "orderInfo": "Thanh toan don hang #673",
        "orderType": "momo_wallet",
        "transId": "4755295878",
        "resultCode": "0",
        "message": "Successful.",
        "payType": "napas",
        "responseTime": "1780416956088",
        "extraData": "",
        "signature": "38ec8d629f1756abd4b267bad14dc39a4a56a70a56a16fdb3f0a6ad82af45cb2",
    }
    assert momo.verify_return_signature(payload) is True


def test_verify_ipn_signature(monkeypatch):
    monkeypatch.setattr(momo.settings, "MOMO_SECRET_KEY", "TEST_SECRET")

    payload = {
        "partnerCode": "MOMO",
        "accessKey": "ACCESS",
        "requestId": "1_20260101120000",
        "amount": "50000",
        "orderId": "1_20260101120000",
        "orderInfo": "test",
        "orderType": "momo_wallet",
        "transId": "123456",
        "resultCode": "0",
        "message": "Success",
        "payType": "qr",
        "responseTime": "1700000000000",
        "extraData": "",
    }
    raw = (
        f"accessKey={payload['accessKey']}&amount={payload['amount']}"
        f"&extraData={payload['extraData']}&message={payload['message']}"
        f"&orderId={payload['orderId']}&orderInfo={payload['orderInfo']}"
        f"&partnerCode={payload['partnerCode']}&payType={payload['payType']}"
        f"&requestId={payload['requestId']}&responseTime={payload['responseTime']}"
        f"&resultCode={payload['resultCode']}&transId={payload['transId']}"
    )
    payload["signature"] = hmac.new(
        b"TEST_SECRET", raw.encode("utf-8"), hashlib.sha256
    ).hexdigest()

    assert momo.verify_ipn_signature(payload) is True


def test_is_paid_result():
    assert momo.is_paid_result(0) is True
    assert momo.is_paid_result("0") is True
    assert momo.is_paid_result(49) is False
