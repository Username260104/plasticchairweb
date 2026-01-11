FROM nginx:alpine

# 정적 파일들을 Nginx의 기본 경로로 복사합니다.
COPY . /usr/share/nginx/html

# Nginx 기본 포트 80 노출
EXPOSE 80
