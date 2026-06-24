from locust import HttpUser, task, between


class ChatUser(HttpUser):
    wait_time = between(0.1, 0.5)

    @task
    def query_definition(self):
        self.client.post("/api/query", json={"q": "學習", "mode": "definition"})

    @task
    def query_pronunciation(self):
        self.client.post("/api/query", json={"q": "中文", "mode": "pronunciation"})