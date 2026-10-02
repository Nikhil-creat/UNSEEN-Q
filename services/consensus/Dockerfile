FROM golang:1.23 AS b
WORKDIR /src
COPY . .
RUN go mod tidy && CGO_ENABLED=0 go build -o /out/consensus .
FROM gcr.io/distroless/static:nonroot
COPY --from=b /out/consensus /consensus
USER nonroot
ENTRYPOINT ["/consensus"]
