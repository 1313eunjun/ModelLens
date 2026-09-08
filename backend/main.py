import torch

from fastapi import FastAPI
from pydantic import BaseModel
from transformers import AutoTokenizer, AutoModel


app = FastAPI()

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
    return {"message": "ModelLens backend is running"}


@app.post("/attention")
def get_attention(request: TextRequest):
    inputs = tokenizer(request.text, return_tensors="pt")

    with torch.no_grad():
        outputs = model(
            **inputs,
            output_attentions=True
        )

    tokens = tokenizer.convert_ids_to_tokens(
        inputs["input_ids"][0]
    )

    first_layer_first_head = outputs.attentions[0][0][0]

    return {
        "tokens": tokens,
        "attention": first_layer_first_head.tolist()
    }
