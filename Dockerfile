# Node.js 22 Alpine 이미지 사용
FROM node:22-alpine

# 작업 디렉토리 설정
WORKDIR /usr/src/app

# package.json과 package-lock.json을 먼저 복사
COPY package*.json ./

# npm 의존성 설치
RUN npm ci --only=production

# 애플리케이션 소스 복사
COPY . .

# uploads 디렉토리 권한 설정
RUN mkdir -p uploads && chmod 755 uploads

# 비루트 유저 생성 및 설정
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001
RUN chown -R nextjs:nodejs /usr/src/app
USER nextjs

# 포트 노출
EXPOSE 3535

# 애플리케이션 시작
CMD ["npm", "start"]