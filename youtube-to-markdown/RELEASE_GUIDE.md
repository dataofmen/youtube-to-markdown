# 🚀 앱 릴리스 가이드 (Mac Desktop App)

이 프로젝트는 **GitHub Actions**를 통해 새로운 원격 저장소에 자동으로 빌드 및 릴리스되도록 설정되었습니다.

## 1. 저장소 연결 설정

새로운 원격 저장소를 만드신 후, 로컬에서 다음 명령어를 입력하여 연결을 업데이트하세요.

```bash
# 기존 연결 삭제 (필요한 경우)
git remote remove origin

# 새로운 저장소 연결 (URL을 실제 값으로 수정하세요)
git remote add origin https://github.com/dataofmen/NEW_REPO_NAME.git
```

## 2. package.json 수정

현재 `package.json`의 `repository`와 `publish` 섹션에 `PLACEHOLDER_REPO`로 설정되어 있습니다. 이를 실제 저장소 이름으로 수정해야 합니다.

```json
"repository": {
  "type": "git",
  "url": "https://github.com/dataofmen/실제_저장소_이름.git"
},
...
"publish": [
  {
    "provider": "github",
    "owner": "dataofmen",
    "repo": "실제_저장소_이름"
  }
]
```

## 3. 릴리스 방법 (자동화)

GitHub Actions가 설정되어 있어, 특정 버전을 태그하여 푸시하면 자동으로 `.dmg`와 `.zip` 파일이 GitHub Releases에 업로드됩니다.

```bash
# 1. 변경사항 커밋 및 푸시
git add .
git commit -m "Prepare for release v1.0.0"
git push origin main

# 2. 버전 태그 생성 및 푸시 (이 시점에 GitHub Actions가 실행됨)
git tag v1.0.0
git push origin v1.0.0
```

## 4. GitHub 저장소 설정

GitHub Actions가 Releases를 생성할 수 있도록 권한을 확인해야 합니다:
1. 저장소의 **Settings > Actions > General**로 이동합니다.
2. **Workflow permissions** 섹션에서 **Read and write permissions**를 선택하고 저장합니다.

## 5. 수동 릴리스 (필요한 경우)

로컬에서 직접 릴리스를 업로드하려면 다음 명령어를 사용하세요. (GitHub Token 설정 필요)

```bash
export GH_TOKEN=your_github_token
npm run app:build -- --publish always
```
