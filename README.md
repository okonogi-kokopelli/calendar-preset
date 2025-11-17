# Calendar Preset

Googleカレンダーの表示設定をプリセットで保存・切り替えできるChrome拡張機能です。サイドパネルで常時アクセスでき、複数のカレンダー表示パターンをワンクリックで切り替えられます。

---

## できること（主要機能）

- **サイドパネル表示**: Googleカレンダーのページで自動的に開き、常時アクセス可能
- **自動開閉**: タブ移動時にGoogleカレンダーのページでのみサイドパネルを自動で開く
- **プリセット保存**: 現在のカレンダー表示状態を名前付きで保存
- **表示形式の保存**: カレンダーの表示形式（日/週/月/年/スケジュール）もプリセットに保存可能
- **ワンクリック切り替え**: 保存したプリセットをワンクリックで適用
- **プリセット編集**: 既存のプリセットを編集・更新
- **ドラッグ&ドロップ並び替え**: プリセットの表示順序をドラッグで自由に変更
- **クイックアクション**:
  - **全て選択**: 全てのカレンダーを一括選択（自分のカレンダーを含む）
  - **全て解除**: 全てのカレンダーを一括解除（オプションで自分のカレンダーを残す）
- **柔軟な設定**: グローバル設定とプリセット個別設定で表示形式の動作をカスタマイズ
- **安定したID管理**: カレンダーの固有IDで識別（順序や名前が変わっても正しく動作）
- **キーボードショートカット**: `Command+Shift+K` (Mac) / `Ctrl+Shift+K` (Windows/Linux)

---

## セットアップ手順

### 1. 前提条件

- Google Chrome または Chromium ベースのブラウザ（Side Panel API対応版）
- Googleカレンダーのアカウント

### 2. ソースコードの取得

```bash
git clone <repository-url>
cd calendar-preset
```

### 3. 拡張機能のインストール

1. Chrome で `chrome://extensions/` を開く
2. 右上の「デベロッパー モード」を有効化
3. 「パッケージ化されていない拡張機能を読み込む」をクリック
4. 本プロジェクトのフォルダを選択
5. 拡張機能が読み込まれたことを確認

---

## 使い方

### 基本フロー

1. Googleカレンダー（https://calendar.google.com）を開く
2. サイドパネルが開きます
   拡張機能アイコンをクリック、または `Command+Shift+K` (Mac) / `Ctrl+Shift+K` (Windows/Linux)
3. 表示したいカレンダーをGoogleカレンダー上でチェック
4. 必要に応じて表示形式（日/週/月/年/スケジュール）を選択
5. サイドパネルで「プリセット名」を入力して「保存」をクリック

### プリセットの適用

1. サイドパネルの「保存済みプリセット」から適用したいプリセットを選択
2. 「適用」ボタンをクリック
3. Googleカレンダーの表示が即座に切り替わります

### プリセットの編集

1. プリセット名の右にある「⋮」メニューをクリック
2. 「編集」を選択
3. Googleカレンダー上でカレンダーの表示を調整
4. 「更新」ボタンをクリックして変更を保存

### プリセットの削除

1. プリセット名の右にある「⋮」メニューをクリック
2. 「削除」を選択
3. 確認ダイアログで「OK」をクリック

### プリセットの並び替え

1. プリセット一覧で、並び替えたいプリセットをドラッグ
2. 青いラインが表示される位置にドロップ
3. 順序が自動的に保存されます

### クイックアクション

#### 全て選択
全てのカレンダー（自分のカレンダーを含む）を一括選択します。

#### 全て解除
- デフォルト（チェックなし）: 自分のメインカレンダーは残し、他のカレンダーを解除
- チェックあり: 自分のカレンダーも含めて全て解除

### 表示形式の保存と切り替え

1. **保存時の動作**:
   - デフォルトで現在の表示形式（日/週/月/年/スケジュール）がプリセットに保存されます
   - 設定画面で保存動作をカスタマイズ可能

2. **適用時の動作**:
   - デフォルトでプリセット適用時に表示形式も自動的に切り替わります
   - 設定画面またはプリセット編集画面で切り替え動作をカスタマイズ可能

3. **設定画面**:
   - タイトル横の⚙️アイコンから設定画面を開く
   - 「プリセット保存時に表示形式も保存する」のON/OFF
   - 「プリセット適用時に表示形式も切り替える」のON/OFF

4. **プリセット個別設定**:
   - プリセット編集画面で個別に設定可能
   - 「更新時に表示形式も保存する」
   - 「適用時に表示形式も切り替える」

### 自動開閉機能

- Googleカレンダーのページに移動すると、サイドパネルが自動的に開きます
- 他のページに移動すると、サイドパネルが自動的に閉じます
- タブを切り替えた時も同様に動作します

---

## ファイル構成

```
calendar-preset/
├── manifest.json          # 拡張機能の設定（Manifest V3）
├── background.js          # Service Workerエントリーポイント
├── content.js             # Content Scriptエントリーポイント
├── sidepanel.html         # サイドパネルUI
├── styles.css             # サイドパネルのスタイルシート
├── README.md              # 本ファイル（ユーザー向け）
└── src/                   # モジュール群（ES Modules）
    ├── shared/            # 共通定数・ユーティリティ
    │   └── constants.js
    ├── background/        # Service Worker（4モジュール）
    │   ├── main.js
    │   ├── state.js
    │   ├── sidepanel.js
    │   └── tabs.js
    ├── content/           # Content Script（6モジュール）
    │   ├── main.js
    │   ├── message-handler.js
    │   └── calendar/
    │       ├── dom.js
    │       ├── state.js
    │       ├── actions.js
    │       └── utils.js
    └── sidepanel/         # Side Panel（11モジュール）
        ├── main.js
        ├── constants.js
        ├── utils/
        ├── ui/
        ├── services/
        └── components/
```

---

## 技術仕様

### アーキテクチャ

**モジュール構成**: ES Modules（VanillaJS）でコンポーネント化
- ビルドツール不要
- 機能別にモジュール分割（保守性向上）
- 共通定数で重複を削減

### データフロー

1. **Content Script** (`src/content/`): Googleカレンダーのページからカレンダー情報を取得
2. **Side Panel** (`src/sidepanel/`): ユーザー操作を受け付け、Content Scriptにメッセージを送信
3. **Content Script**: カレンダーの表示状態を変更（チェックボックスの操作）
4. **Chrome Storage API**: プリセットデータをローカルに永続化

### カレンダーの識別方法

各カレンダーは以下の優先順位でIDを取得します：

1. `data-id` 属性（メールアドレス形式）
2. `data-calendarid` 属性
3. その他のカレンダー固有属性
4. フォールバック: `name:カレンダー名`

この方法により、カレンダーの順序が変わっても正しく識別できます。

### 段階的スクロール

カレンダーリストが長い場合、仮想スクロールに対応するため段階的にスクロールしながら全てのカレンダーを操作します：

1. スクロール可能な要素を検出
2. 画面の80%ずつスクロール
3. 各位置で表示されているカレンダーを操作
4. 元の位置に戻す

### 主な技術

- **Manifest V3**: Service Worker ベースの最新仕様
- **Side Panel API**: Chrome の右側サイドパネル表示
- **Chrome Storage API**: プリセットデータの永続化
- **MutationObserver**: カレンダーリストの動的変更検知
- **イベント駆動**: タブ切り替え・URL変更の自動検知

### 対応ブラウザ

- Google Chrome（推奨、バージョン114以降）
- Microsoft Edge
- その他 Chromium ベース（Side Panel API対応版）

---

## プリセット管理の詳細

### プリセットデータ構造

```javascript
{
  "presetId": {
    "name": "仕事用",
    "calendars": [
      "user@example.com",
      "team@example.com",
      // チェックされているカレンダーのIDリスト
    ],
    "viewType": "month", // 表示形式 (day/week/month/year/agenda/customweek/customday または null)
    "saveViewType": true, // 編集時に表示形式を保存するか
    "applyViewType": true, // 適用時に表示形式を切り替えるか
    "createdAt": "2025-10-31T12:00:00.000Z",
    "updatedAt": "2025-10-31T13:00:00.000Z", // 編集時のみ
    "order": 0 // 表示順序（ドラッグ&ドロップで変更可能）
  }
}
```

### グローバル設定

```javascript
{
  "settings": {
    "saveViewTypeByDefault": true,  // デフォルトで表示形式を保存するか
    "applyViewTypeByDefault": true  // デフォルトで表示形式を切り替えるか
  }
}
```

### プリセット適用のロジック

1. 保存されているカレンダーIDリストを取得
2. Googleカレンダーページ上の全てのカレンダーをスキャン
3. IDが一致するカレンダーをチェック、それ以外をチェック解除
4. 段階的スクロールで全てのカレンダーに適用

---

## トラブルシューティング

### サイドパネルが開かない場合

1. 拡張機能が有効になっているか確認（`chrome://extensions/`）
2. Googleカレンダーのページを再読み込み
3. Chromeを再起動

### プリセットが保存されない場合

1. Googleカレンダーのページであることを確認
2. カレンダーリストが表示されているか確認（左サイドバー）
3. ブラウザのコンソール（F12 → Console）でエラーを確認

### プリセットが適用されない場合

1. Googleカレンダーのページを再読み込み
2. カレンダーリストが表示されているか確認
3. 保存時と異なるカレンダーIDの場合は再保存

### エラーログの確認

1. **Content Script**: Googleカレンダーのページでデベロッパーツール → Console
2. **Background Script**: `chrome://extensions/` → 拡張機能の「Service Workerを検査」
3. **Side Panel**: サイドパネル上で右クリック → 検証

---

## セキュリティ対策

1. **XSS対策**: `textContent` で安全に表示、`innerHTML` は不使用
2. **権限の最小化**: 必要最小限のhost_permissionsのみ（`https://calendar.google.com/*`）
3. **ローカルストレージ**: プリセットデータは全てローカルに保存（外部送信なし）
4. **入力サニタイズ**: プリセット名などのユーザー入力を適切に処理

---

## プライバシー

- **データ収集**: なし
- **外部通信**: なし
- **データ保存**: Chrome Storage APIでローカル保存のみ
- **対象サイト**: `https://calendar.google.com/*` のみ

---

## リリースとライセンス

### リリース手順

1. `manifest.json` のバージョンを更新
2. zipでパッケージ化
3. Chrome ウェブストアのデベロッパーダッシュボードにアップロード

### ライセンス

本プロジェクトのライセンスについては、プロジェクトルートのLICENSEファイルを参照してください。

---

## 注意事項

- この拡張機能は非公式です
- Googleカレンダーの仕様変更により動作しなくなる可能性があります
- プリセットデータはローカル（ブラウザ）に保存されます
- 複数のデバイス間での同期は現在サポートしていません
- 表示形式の切り替え時、編集中のデータがある場合は確認メッセージが表示されることがあります

---

## カスタマイズ

### スタイルのカスタマイズ

`styles.css` を編集してサイドパネルの外観を変更できます。

```css
/* 例: プライマリカラーの変更 */
button {
  background-color: #1a73e8; /* お好みの色に変更 */
}
```

### カレンダー検出ロジックのカスタマイズ

`src/content/calendar/` の以下のモジュールを編集：

- `state.js`: カレンダー状態の取得（`getCurrentState()`）
- `actions.js`: プリセットの適用（`applyPreset()`）
- `utils.js`: カレンダーID取得ロジック（`getCalendarId()`）

---

## 開発

### 開発者向けドキュメント

詳細な開発者向けドキュメント（アーキテクチャ、設計決定、開発ガイドライン等）は、プロジェクトルートの `CLAUDE.md` を参照してください（gitで追跡されていません）。

### デバッグ方法

1. **Content Script**: Googleカレンダーのページで F12 → Console
2. **Service Worker**: `chrome://extensions/` → 「Service Workerを検査」
3. **Side Panel**: サイドパネル上で右クリック → 「検証」

### 主要なモジュール

#### src/background/
- `main.js`: イベントリスナー登録
- `state.js`: サイドパネル状態管理
- `sidepanel.js`: サイドパネル操作（`toggleSidePanelSync()`）
- `tabs.js`: タブ/ウィンドウ管理（`handleTabChange()`）

#### src/content/
- `message-handler.js`: メッセージリスナー
- `calendar/state.js`: カレンダー状態取得（`getCurrentState()`）
- `calendar/actions.js`: カレンダー操作（`applyPreset()`, `selectAll()`, `deselectAll()`）
- `calendar/dom.js`: DOM操作（グループ展開、スクロール）
- `calendar/utils.js`: ユーティリティ（`getCalendarId()`, `getCalendarName()`）

#### src/sidepanel/
- `main.js`: エントリーポイント、イベントリスナー登録
- `services/preset.js`: プリセット管理（`savePreset()`, `applyPreset()`, `editPreset()`, `deletePreset()`）
- `services/storage.js`: Chrome Storage操作
- `components/preset-list.js`: プリセット一覧レンダリング
- `components/drag-drop.js`: ドラッグ&ドロップ処理

#### src/shared/
- `constants.js`: 共通定数（URLパターン、デフォルト設定、スクロール設定等）
