# Stage 1 — Build React client
FROM node:22-alpine AS client-build
WORKDIR /app/client
COPY src/WorldCup.Web/package.json src/WorldCup.Web/package-lock.json ./
RUN npm ci
COPY src/WorldCup.Web/ ./
RUN npm run build

# Stage 2 — Publish .NET API
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS api-publish
WORKDIR /src
COPY src/WorldCup.Api/ WorldCup.Api/
COPY --from=client-build /app/client/dist WorldCup.Api/wwwroot/
RUN dotnet publish WorldCup.Api/WorldCup.Api.csproj \
    -c Release -o /app/publish --no-self-contained

# Stage 3 — Final runtime image
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final
WORKDIR /app
COPY --from=api-publish /app/publish ./

ENV ASPNETCORE_URLS=http://+:8080

EXPOSE 8080
ENTRYPOINT ["dotnet", "WorldCup.Api.dll"]
