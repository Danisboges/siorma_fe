"use client";

import { useEffect, useState } from "react";

export default function TestAPI() {
  const [result, setResult] = useState("");

  useEffect(() => {
    fetch("http://127.0.0.1:8000/api/health", {
      method: "GET",
      headers: {
        Accept: "application/json",
      }
    })
    .then(res => res.json())
    .then(data => setResult(JSON.stringify(data)))
    .catch(err => setResult("ERROR: " + err.message));
  }, []);

  return (
    <div>
      <h1>Test API</h1>
      <pre>{result}</pre>
    </div>
  );
}
