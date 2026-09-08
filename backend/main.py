import torch

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from transformers import AutoTokenizer, AutoModel


app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


MODEL_NAME = "jsun/bert-tiny"

tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)

model = AutoModel.from_pretrained(
    MODEL_NAME,
    attn_implementation="eager"
)


class TextRequest(BaseModel):
    text: str


@app.get("/")
def root():
    return {
        "message": "ModelLens backend is running"
    }


@app.post("/attention")
def get_attention(request: TextRequest):
    inputs = tokenizer(
        request.text,
        return_tensors="pt"
    )

    with torch.no_grad():
        outputs = model(
            **inputs,
            output_attentions=True
        )

    tokens = tokenizer.convert_ids_to_tokens(
        inputs["input_ids"][0]
    )

    all_attentions = [
        layer[0].tolist()
        for layer in outputs.attentions
    ]

    return {
        "tokens": tokens,
        "attentions": all_attentions,
        "num_layers": len(outputs.attentions),
        "num_heads": outputs.attentions[0].shape[1]
    }
