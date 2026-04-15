from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_create_pair():
    response = client.post("/api/pairs", json={"user_name": "TestUser1"})
    assert response.status_code == 200
    assert "pair_id" in response.json()

def test_join_pair():
    response = client.post("/api/pairs", json={"user_name": "TestUser1"})
    pair_id = response.json()["pair_id"]
    
    resp_join = client.post(f"/api/pairs/{pair_id}/join", json={"user_name": "TestUser2"})
    assert resp_join.status_code == 200
    assert resp_join.json()["user_id"] == 2

def test_update_status():
    response = client.post("/api/pairs", json={"user_name": "TestUser1"})
    pair_id = response.json()["pair_id"]
    
    res = client.put(f"/api/pairs/{pair_id}/status", json={"user_id": 1, "status": "BUSY"})
    assert res.status_code == 200

def test_update_notify():
    response = client.post("/api/pairs", json={"user_name": "TestUser1"})
    pair_id = response.json()["pair_id"]
    
    res = client.put(f"/api/pairs/{pair_id}/notify", json={"user_id": 1, "mode": "SOUND"})
    assert res.status_code == 200

def test_get_pair():
    response = client.post("/api/pairs", json={"user_name": "TestUser1"})
    pair_id = response.json()["pair_id"]
    
    res = client.get(f"/api/pairs/{pair_id}")
    assert res.status_code == 200
