import torch
from transformers import AutoTokenizer, AutoModel

MODEL_NAME = "jsun/bert-tiny"

tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)

model = AutoModel.from_pretrained(
    MODEL_NAME,
    attn_implementation="eager"
)

text = "The cat sat on the mat."

inputs = tokenizer(text, return_tensors="pt")

with torch.no_grad():
    outputs = model(
        **inputs,
        output_attentions=True
    )

tokens = tokenizer.convert_ids_to_tokens(inputs["input_ids"][0])
attentions = outputs.attentions

print("Tokens:")
print(tokens)

print("\nNumber of layers:")
print(len(attentions))

print("\nAttention shape for layer 1:")
print(attentions[0].shape)

first_head = attentions[0][0][0]

print("\nLayer 1, Head 1 attention:")
for i, token in enumerate(tokens):
    print(f"{token:>8} -> {first_head[i].tolist()}")
