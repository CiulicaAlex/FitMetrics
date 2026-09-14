FROM node:24-alpine AS frontend-build
WORKDIR /src/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

FROM mcr.microsoft.com/dotnet/sdk:9.0 AS backend-build
WORKDIR /src
COPY ["Fit Metrics/Fit Metrics.csproj", "Fit Metrics/"]
RUN dotnet restore "Fit Metrics/Fit Metrics.csproj"
COPY ["Fit Metrics/", "Fit Metrics/"]
RUN dotnet publish "Fit Metrics/Fit Metrics.csproj" -c Release -o /app/publish --no-restore

FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS runtime
WORKDIR /app
ENV ASPNETCORE_URLS=http://+:8080 \
    ASPNETCORE_ENVIRONMENT=Production \
    Database__Provider=Sqlite \
    ConnectionStrings__DefaultConnection="Data Source=/app/data/fitmetrics.db"
EXPOSE 8080
VOLUME ["/app/data"]
COPY --from=backend-build /app/publish ./
COPY --from=frontend-build /src/frontend/dist ./wwwroot
RUN mkdir -p /app/data
ENTRYPOINT ["dotnet", "Fit Metrics.dll"]
