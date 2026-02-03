# Renderへのバックエンドデプロイ手順（画像付き）

## 🎯 目的
バックエンドAPIをRender.comにデプロイして、GitHub Pagesのフロントエンドから使えるようにする

## ⏱️ 所要時間
約10分

---

## ステップ1: Renderにサインアップ

1. https://render.com にアクセス
2. 「Get Started」または「Sign Up」をクリック
3. 「Sign up with GitHub」を選択
4. GitHubアカウントで認証

---

## ステップ2: Web Serviceを作成

1. ダッシュボードで「New +」ボタンをクリック
2. 「Web Service」を選択

---

## ステップ3: リポジトリを接続

1. 「Connect a repository」セクションで、リポジトリを検索:
   ```
   uchu-roku/zaisekiyosokuapp
   ```

2. 「Connect」ボタンをクリック

   ⚠️ リポジトリが表示されない場合:
   - 「Configure account」をクリック
   - Renderに必要な権限を付与

---

## ステップ4: サービスを設定

以下の項目を入力:

### 基本設定
```
Name: timber-volume-api
（または任意の名前）
```

### 環境
```
Environment: Python 3
```

### リージョン
```
Region: Oregon (US West)
（または最も近いリージョン）
```

### ブランチ
```
Branch: main
```

### ルートディレクトリ
```
Root Directory: (空欄のまま)
```

### ビルドコマンド
```
pip install -r backend/requirements.txt
```

### 起動コマンド
```
cd backend && uvicorn main:app --host 0.0.0.0 --port $PORT
```

### インスタンスタイプ
```
Instance Type: Free
```

---

## ステップ5: 環境変数を設定（オプション）

「Advanced」セクションを展開して、必要に応じて環境変数を追加:

```
Key: PYTHON_VERSION
Value: 3.11
```

---

## ステップ6: デプロイを開始

1. 「Create Web Service」ボタンをクリック
2. デプロイが開始されます（5-10分かかります）

### デプロイログを確認

画面に表示されるログで進行状況を確認:

```
==> Cloning from https://github.com/uchu-roku/zaisekiyosokuapp...
==> Checking out commit...
==> Running build command 'pip install -r backend/requirements.txt'...
==> Installing dependencies...
==> Build successful!
==> Starting service with 'cd backend && uvicorn main:app --host 0.0.0.0 --port $PORT'...
==> Your service is live 🎉
```

---

## ステップ7: URLをコピー

1. デプロイが完了すると、画面上部にURLが表示されます:
   ```
   https://timber-volume-api.onrender.com
   ```

2. このURLをコピーします

3. ブラウザで確認:
   ```
   https://timber-volume-api.onrender.com
   ```
   
   以下のJSONが表示されればOK:
   ```json
   {"message":"材積予測API","version":"0.1.0-MVP"}
   ```

4. データエンドポイントも確認:
   ```
   https://timber-volume-api.onrender.com/administrative/boundaries
   ```
   
   GeoJSONデータが表示されればOK

---

## ステップ8: GitHubシークレットを設定

1. GitHubリポジトリにアクセス:
   ```
   https://github.com/uchu-roku/zaisekiyosokuapp
   ```

2. 「Settings」タブをクリック

3. 左サイドバーで「Secrets and variables」→「Actions」を選択

4. 「New repository secret」ボタンをクリック

5. シークレットを追加:
   ```
   Name: VITE_API_URL
   Secret: https://timber-volume-api.onrender.com
   ```
   ⚠️ 末尾のスラッシュ（/）は付けない

6. 「Add secret」ボタンをクリック

---

## ステップ9: 再デプロイ

ローカルで変更をプッシュ:

```bash
# 変更をコミット（render.yamlを追加）
git add .
git commit -m "Add Render deployment config"
git push
```

GitHub Actionsが自動的に実行され、新しいバックエンドURLでフロントエンドがビルドされます。

---

## ステップ10: 動作確認

1. GitHub Actionsの実行を確認:
   ```
   https://github.com/uchu-roku/zaisekiyosokuapp/actions
   ```

2. デプロイが完了したら、サイトにアクセス:
   ```
   https://uchu-roku.github.io/zaisekiyosokuapp/
   ```

3. 「行政区域 ON」ボタンをクリック

4. 地図に境界線が表示されればOK！

---

## 🐛 トラブルシューティング

### デプロイが失敗する

**エラー**: `No module named 'fastapi'`

**解決方法**: `backend/requirements.txt`が正しいか確認

---

### データファイルが見つからない

**エラー**: `行政区域データが見つかりません`

**原因**: Git LFSファイルがプルされていない

**解決方法**:

1. Renderのダッシュボード → サービス → 「Manual Deploy」→「Clear build cache & deploy」

2. または、ローカルで:
   ```bash
   git lfs install
   git lfs pull
   git push
   ```

---

### CORSエラー

**エラー**: `Access to fetch at '...' has been blocked by CORS policy`

**解決方法**: `backend/main.py`のCORS設定を確認:

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # または ["https://uchu-roku.github.io"]
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

---

### Renderの無料プランの制限

- **スリープ**: 15分間アクセスがないとスリープ状態になる
- **起動時間**: スリープから復帰に30秒〜1分かかる
- **月間時間**: 750時間/月まで無料

**対策**: 
- 有料プラン（$7/月）にアップグレード
- または、定期的にアクセスしてスリープを防ぐ

---

## ✅ 完了チェックリスト

- [ ] Renderでバックエンドをデプロイした
- [ ] バックエンドのURLにアクセスして動作確認した
- [ ] GitHubシークレットに`VITE_API_URL`を設定した
- [ ] `git push`で再デプロイした
- [ ] GitHub Actionsが成功した
- [ ] サイトにアクセスして地図が表示された
- [ ] 「行政区域 ON」で境界線が表示された
- [ ] 「河川 ON」で河川が表示された
- [ ] 「森林簿 ON」で林班・小班が表示された

---

## 📞 サポート

問題が解決しない場合:

1. Renderのログを確認（「Logs」タブ）
2. ブラウザのコンソール（F12）でエラーを確認
3. GitHub Actionsのログを確認

スクリーンショットを撮って、具体的なエラーメッセージを確認してください。
