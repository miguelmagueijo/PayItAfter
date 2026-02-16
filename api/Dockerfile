FROM golang:1.26-alpine AS builder

WORKDIR /app

COPY go.mod go.sum ./

RUN go mod download

COPY main.go ./

RUN go build -o ./payitafter

FROM alpine:latest

WORKDIR /app

COPY --from=builder /app/payitafter .

RUN mkdir /app/data

CMD ["sh", "-c", "./payitafter"]