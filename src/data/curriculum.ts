import type { Lesson, ModuleGroup, SandboxPreset } from '../types/python';

export const MODULES: ModuleGroup[] = [
  {
    id: 'm1',
    order: '01',
    title: '變數、型別與資料運算',
    subtitle: '理解 Python 動態型別、記憶體參考與 f-string 格式化輸出',
    lessons: [
      {
        id: '1-1',
        moduleId: 'm1',
        moduleTitle: '變數、型別與資料運算',
        orderLabel: '1.1',
        title: '變數賦值與動態型別切換',
        durationLabel: '8 分鐘',
        difficultyLabel: '入門',
        summary: '在 Python 中變數不需要事先宣告型別，賦值符號 `=` 代表將右側物件綁定到左側名稱，且同一個變數可以重新指向不同型別的資料。',
        conceptPoints: [
          '整數 (int)、浮點數 (float)、字串 (str) 與布林值 (bool) 是最核心的四種基礎型別。',
          '使用雙變數交換語法 `a, b = b, a` 可不透過暫存變數直接交換內容。',
          '打開「執行視覺化」標籤，觀察每次賦值時記憶體欄位的即時變化。',
        ],
        starterCode: `# 建立兩個變數並交換它們的值
score = 85
bonus = 15

# 任務：將 total 設為 score 與 bonus 的總和
# 並將 status 設為 True
total = 0
status = False

print("總分：", total)
print("狀態：", status)`,
        solutionCode: `score = 85
bonus = 15

total = score + bonus
status = True

print("總分：", total)
print("狀態：", status)`,
        hint: '將 `total` 改為 `score + bonus`，並把 `status` 設為布林值 `True`（注意首字大寫）。',
        tests: [
          {
            id: 't1',
            label: '驗證變數 total 數值',
            description: 'total 應等於 score + bonus',
            expectedSummary: 'total == 100',
            testCode: `assert "total" in globals(), "找不到變數 total"
assert total == score + bonus and total == 100, f"預期 100，實際為 {total}"`,
          },
          {
            id: 't2',
            label: '驗證布林型別與值',
            description: 'status 應為 bool 型別的 True',
            expectedSummary: 'status is True',
            testCode: `assert status is True, f"預期 True，實際為 {status}"`,
          },
        ],
      },
      {
        id: '1-2',
        moduleId: 'm1',
        moduleTitle: '變數、資料型別與輸出',
        orderLabel: '1.2',
        title: 'f-string 字串格式化與小數精度',
        durationLabel: '10 分鐘',
        difficultyLabel: '入門',
        summary: '使用 `f"...{運算式}..."` 語法可以直接在字串內嵌入變數與計算結果，並透過 `:.2f` 控制浮點數的小數位數。',
        conceptPoints: [
          '在字串引號前加上 `f`，大括號 `{}` 內的任何有效運算式都會被即時求值。',
          '`:.1f` 或 `:.2f` 可將浮點數格式化為固定小數位數，常用於金額或比例顯示。',
        ],
        explorerKind: 'fstring',
        starterCode: `item = "藍牙機械鍵盤"
price = 2480
discount = 0.85

# 計算折後價格，並使用 f-string 格式化輸出
final_price = price * discount
summary = f"{item} 折扣後為 {final_price:.0f} 元"
print(summary)`,
        solutionCode: `item = "藍牙機械鍵盤"
price = 2480
discount = 0.85

final_price = price * discount
summary = f"{item} 折扣後為 {final_price:.0f} 元"
print(summary)`,
        hint: '嘗試在右側的互動參數探索器中調整原價與折扣，觀察 `f-string` 如何動態生成結果。',
        tests: [
          {
            id: 't1',
            label: '檢查 final_price 計算',
            description: 'final_price 應正確套用折扣',
            expectedSummary: 'final_price == 2108.0',
            testCode: `assert abs(final_price - price * discount) < 1e-6, f"計算結果不正確：{final_price}"`,
          },
          {
            id: 't2',
            label: '檢查格式化輸出字串',
            description: '終端機應印出包含「元」的完整價格敘述',
            expectedSummary: '包含商品名稱與折扣價格',
            testCode: `assert item in __USER_STDOUT__ and "元" in __USER_STDOUT__, "輸出需包含商品名稱與金額單位"`,
          },
        ],
      },
      {
        id: '1-3',
        moduleId: 'm1',
        moduleTitle: '變數、資料型別與輸出',
        orderLabel: '1.3',
        title: '整除、餘數與型別轉換挑戰',
        durationLabel: '10 分鐘',
        difficultyLabel: '入門',
        summary: '區分一般除法 `/`、整數除法 `//` 與取餘數 `%`，這三者是時間換算、分頁計算與奇偶判斷的基礎工具。',
        conceptPoints: [
          '`135 // 60` 會得到整數商數 `2`（小時），`135 % 60` 會得到餘數 `15`（分鐘）。',
          '一般除法 `/` 在 Python 3 中永遠回傳浮點數 `float`，即使剛好整除也是如此。',
        ],
        starterCode: `total_minutes = 145

# 任務：計算出 hours (小時) 與 minutes (剩餘分鐘)
hours = 0
minutes = 0

print(f"{total_minutes} 分鐘 = {hours} 小時 {minutes} 分鐘")`,
        solutionCode: `total_minutes = 145

hours = total_minutes // 60
minutes = total_minutes % 60

print(f"{total_minutes} 分鐘 = {hours} 小時 {minutes} 分鐘")`,
        hint: '使用 `//` 取得整數小時，使用 `%` 取得剩餘分鐘數。',
        tests: [
          {
            id: 't1',
            label: '驗證小時計算',
            description: 'hours 應為整數商數 2',
            expectedSummary: 'hours == 2',
            testCode: `assert hours == 2 and isinstance(hours, int), f"預期 int 類型 2，實際為 {hours}"`,
          },
          {
            id: 't2',
            label: '驗證剩餘分鐘計算',
            description: 'minutes 應為餘數 25',
            expectedSummary: 'minutes == 25',
            testCode: `assert minutes == 25, f"預期 25，實際為 {minutes}"`,
          },
        ],
      },
    ],
  },
  {
    id: 'm2',
    order: '02',
    title: '條件判斷與邏輯思維',
    subtitle: '掌握 if / elif / else 分支控制與複合布林條件',
    lessons: [
      {
        id: '2-1',
        moduleId: 'm2',
        moduleTitle: '條件判斷與邏輯思維',
        orderLabel: '2.1',
        title: 'if / elif / else 多重分支流程',
        durationLabel: '10 分鐘',
        difficultyLabel: '入門',
        summary: '條件判斷讓程式根據不同資料走進唯一一條執行路徑。Python 依賴「縮排（4 個空白）」來界定每個分支所屬的程式區塊。',
        conceptPoints: [
          '判斷順序由上而下，一旦某個條件為 `True`，其餘 `elif` 與 `else` 都會被略過。',
          '拖動下方互動探索器的分數滑桿，觀察哪一個條件分支會被觸發。',
        ],
        explorerKind: 'branch',
        starterCode: `def classify_score(score):
    # 任務：90 以上為 "A"，80~89 為 "B"，70~79 為 "C"，其餘為 "D"
    if score >= 90:
        return "A"
    elif score >= 80:
        return "B"
    else:
        return "D"

for s in [95, 83, 74, 62]:
    print(f"分數 {s} -> 等第 {classify_score(s)}")`,
        solutionCode: `def classify_score(score):
    if score >= 90:
        return "A"
    elif score >= 80:
        return "B"
    elif score >= 70:
        return "C"
    else:
        return "D"

for s in [95, 83, 74, 62]:
    print(f"分數 {s} -> 等第 {classify_score(s)}")`,
        hint: '在 `elif score >= 80:` 後面補上 `elif score >= 70: return "C"` 即可處理 70~79 分的區間。',
        tests: [
          {
            id: 't1',
            label: '測試各級距邊界值',
            description: '90->A, 80->B, 70->C, 69->D',
            expectedSummary: '所有邊界等第皆正確',
            testCode: `assert classify_score(95) == "A", "95 分應為 A"
assert classify_score(80) == "B", "80 分應為 B"
assert classify_score(74) == "C", "74 分應為 C"
assert classify_score(69) == "D", "69 分應為 D"`,
          },
        ],
      },
      {
        id: '2-2',
        moduleId: 'm2',
        moduleTitle: '條件判斷與邏輯思維',
        orderLabel: '2.2',
        title: '複合布林運算與閏年判定',
        durationLabel: '12 分鐘',
        difficultyLabel: '基礎',
        summary: '使用 `and`、`or`、`not` 組合多個條件。在閏年判定中，須同時考量「可被 4 整除但不能被 100 整除」或「可被 400 整除」。',
        conceptPoints: [
          '`and` 需要兩側皆為 `True` 才成立；`or` 只要任一側為 `True` 即成立。',
          '善用括號明確標示邏輯結合順序，可大幅提升程式碼可讀性。',
        ],
        starterCode: `def is_leap_year(year):
    # 任務：實作閏年判斷規則並回傳 True 或 False
    return False

for y in [2000, 1900, 2024, 2026]:
    print(f"{y} 年是否為閏年：{is_leap_year(y)}")`,
        solutionCode: `def is_leap_year(year):
    return (year % 4 == 0 and year % 100 != 0) or (year % 400 == 0)

for y in [2000, 1900, 2024, 2026]:
    print(f"{y} 年是否為閏年：{is_leap_year(y)}")`,
        hint: '條件式可寫成 `(year % 4 == 0 and year % 100 != 0) or (year % 400 == 0)`。',
        tests: [
          {
            id: 't1',
            label: '驗證 400 倍數與 100 倍數例外',
            description: '2000 應為 True，1900 應為 False',
            expectedSummary: '2000->True, 1900->False',
            testCode: `assert is_leap_year(2000) is True, "2000 年可被 400 整除，應為閏年"
assert is_leap_year(1900) is False, "1900 年可被 100 整除但不可被 400 整除，不是閏年"`,
          },
          {
            id: 't2',
            label: '驗證一般年份',
            description: '2024 應為 True，2026 應為 False',
            expectedSummary: '2024->True, 2026->False',
            testCode: `assert is_leap_year(2024) is True, "2024 年應為閏年"
assert is_leap_year(2026) is False, "2026 年不是閏年"`,
          },
        ],
      },
    ],
  },
  {
    id: 'm3',
    order: '03',
    title: '迴圈與迭代過程',
    subtitle: '透過單步執行追蹤 range()、累加器與巢狀迴圈的每一輪狀態',
    lessons: [
      {
        id: '3-1',
        moduleId: 'm3',
        moduleTitle: '迴圈與迭代過程',
        orderLabel: '3.1',
        title: 'for 迴圈與 range(start, stop, step)',
        durationLabel: '10 分鐘',
        difficultyLabel: '基礎',
        summary: '`range(start, stop, step)` 會產生從 `start` 開始、每次遞增 `step`、直到「小於 `stop`」為止的整數序列（包含起點、不包含終點）。',
        conceptPoints: [
          'Python 採用「半開區間」 `[start, stop)` 設計，`range(1, 6)` 會產生 `1, 2, 3, 4, 5`。',
          '在下方調節 `start / stop / step` 滑桿，可直接預覽序列並一鍵套用進程式。',
        ],
        explorerKind: 'range',
        starterCode: `# 任務：計算 2 到 20 之間所有偶數的總和 (2 + 4 + ... + 20)
even_sum = 0
for n in range(2, 21, 2):
    even_sum += n

print("偶數總和：", even_sum)`,
        solutionCode: `even_sum = 0
for n in range(2, 21, 2):
    even_sum += n

print("偶數總和：", even_sum)`,
        hint: '因為 `range` 不包含終點 `stop`，要包含 `20` 時必須將 `stop` 設為 `21`。',
        tests: [
          {
            id: 't1',
            label: '檢查偶數累加結果',
            description: 'even_sum 應等於 110',
            expectedSummary: 'even_sum == 110',
            testCode: `assert even_sum == 110, f"預期 110，實際為 {even_sum}"`,
          },
        ],
      },
      {
        id: '3-2',
        moduleId: 'm3',
        moduleTitle: '迴圈與迭代過程',
        orderLabel: '3.2',
        title: 'while 迴圈與收斂追蹤',
        durationLabel: '12 分鐘',
        difficultyLabel: '基礎',
        summary: '當你事先不知道要重複幾次、只知道「停止條件」時，適合使用 `while` 迴圈。務必確保迴圈變數朝著終止條件推進，避免無窮迴圈。',
        conceptPoints: [
          '每次進入迴圈前都會重新檢查條件式。',
          '點擊工具列的「單步追蹤」，可以逐輪查看 `n` 與 `steps` 的變化過程。',
        ],
        starterCode: `# 考拉茲猜想 (Collatz)：若為偶數除以 2，若為奇數乘 3 加 1，直到變成 1
n = 6
steps = 0
history = [n]

while n != 1:
    if n % 2 == 0:
        n = n // 2
    else:
        n = n * 3 + 1
    history.append(n)
    steps += 1

print("演變過程：", history)
print("總步數：", steps)`,
        solutionCode: `n = 6
steps = 0
history = [n]

while n != 1:
    if n % 2 == 0:
        n = n // 2
    else:
        n = n * 3 + 1
    history.append(n)
    steps += 1

print("演變過程：", history)
print("總步數：", steps)`,
        hint: '試著把 `n = 6` 改成 `n = 7` 並點擊「單步追蹤」，觀察串列 `history` 在記憶體中的擴張！',
        tests: [
          {
            id: 't1',
            label: '驗證迴圈終止狀態',
            description: '迴圈結束時 n 必須收斂為 1',
            expectedSummary: 'n == 1 且 history[-1] == 1',
            testCode: `assert n == 1 and history[-1] == 1, "最終應收斂至 1"
assert steps == len(history) - 1, "steps 應等於變換次數"`,
          },
        ],
      },
      {
        id: '3-3',
        moduleId: 'm3',
        moduleTitle: '迴圈與迭代過程',
        orderLabel: '3.3',
        title: '巢狀迴圈與座標矩陣',
        durationLabel: '12 分鐘',
        difficultyLabel: '中階',
        summary: '外層迴圈每走一步，內層迴圈就會完整執行一輪。這種結構常用於處理二維表格、影像像素或九九乘法表。',
        conceptPoints: [
          '外層控制「列 (row)」，內層控制「欄 (col)」。',
          '使用 `print(..., end=" ")` 可讓同一列的項目接續印出而不換行。',
        ],
        starterCode: `# 任務：產生 1 到 4 的階梯數字金字塔
rows = 4
lines = []

for r in range(1, rows + 1):
    row_text = ""
    for c in range(1, r + 1):
        row_text += str(c)
    lines.append(row_text)
    print(row_text)`,
        solutionCode: `rows = 4
lines = []

for r in range(1, rows + 1):
    row_text = ""
    for c in range(1, r + 1):
        row_text += str(c)
    lines.append(row_text)
    print(row_text)`,
        hint: '外層 `r` 從 1 到 4，內層 `c` 從 1 到 `r`，串接字元即可組成階梯文字。',
        tests: [
          {
            id: 't1',
            label: '驗證每一列階梯輸出',
            description: 'lines 應為 ["1", "12", "123", "1234"]',
            expectedSummary: '["1", "12", "123", "1234"]',
            testCode: `assert lines == ["1", "12", "123", "1234"], f"實際為 {lines}"`,
          },
        ],
      },
    ],
  },
  {
    id: 'm4',
    order: '04',
    title: '串列與字典資料結構',
    subtitle: '視覺化陣列索引、切片 (Slicing)、推導式與鍵值對查詢',
    lessons: [
      {
        id: '4-1',
        moduleId: 'm4',
        moduleTitle: '串列與字典資料結構',
        orderLabel: '4.1',
        title: '串列索引與切片 Slicing 視覺化',
        durationLabel: '12 分鐘',
        difficultyLabel: '基礎',
        summary: 'Python 的串列同時支援從 `0` 開始的正向索引，以及從 `-1` 開始的負向索引。透過 `items[start:stop:step]` 可以快速擷取子序列或反轉串列。',
        conceptPoints: [
          '`items[1:4]` 會取出索引 1、2、3 的元素（不含索引 4）。',
          '`items[::-1]` 代表步長為 `-1`，是反轉串列或字串最簡潔的寫法。',
        ],
        explorerKind: 'slice',
        starterCode: `letters = ["P", "Y", "C", "R", "A", "F", "T"]

# 任務 1：取出中間三個字母 ["C", "R", "A"]
middle = letters[2:5]

# 任務 2：使用負步長切片反轉整個串列
reversed_letters = letters[::-1]

print("中間片段：", middle)
print("反轉結果：", reversed_letters)`,
        solutionCode: `letters = ["P", "Y", "C", "R", "A", "F", "T"]

middle = letters[2:5]
reversed_letters = letters[::-1]

print("中間片段：", middle)
print("反轉結果：", reversed_letters)`,
        hint: '在右側切片互動探索器中滑動起點與終點，看看各索引方格如何被選取。',
        tests: [
          {
            id: 't1',
            label: '驗證 middle 切片範圍',
            description: 'middle 應為 ["C", "R", "A"]',
            expectedSummary: '["C", "R", "A"]',
            testCode: `assert middle == ["C", "R", "A"], f"實際為 {middle}"`,
          },
          {
            id: 't2',
            label: '驗證串列反轉',
            description: 'reversed_letters 應為 ["T", "F", "A", "R", "C", "Y", "P"]',
            expectedSummary: '["T", "F", "A", "R", "C", "Y", "P"]',
            testCode: `assert reversed_letters == ["T", "F", "A", "R", "C", "Y", "P"], f"實際為 {reversed_letters}"`,
          },
        ],
      },
      {
        id: '4-2',
        moduleId: 'm4',
        moduleTitle: '串列與字典資料結構',
        orderLabel: '4.2',
        title: '串列推導式 (List Comprehension)',
        durationLabel: '12 分鐘',
        difficultyLabel: '中階',
        summary: '串列推導式 `[轉換運算 for 元素 in 來源 if 條件]` 能以一行可讀性極高的語法，同時完成資料過濾與映射轉換。',
        conceptPoints: [
          '等同於先建立空串列、再用 `for` 迴圈搭配 `if` 條件呼叫 `append()`。',
          '適合用於清洗資料、提取特定欄位或數學批次轉換。',
        ],
        starterCode: `temps_c = [18, 26, 31, 15, 29, 22]

# 任務：篩選出大於等於 25 度的氣溫，並轉換成華氏 (c * 9 / 5 + 32)
hot_f = [c * 9 / 5 + 32 for c in temps_c if c >= 25]

print("高溫華氏列表：", hot_f)`,
        solutionCode: `temps_c = [18, 26, 31, 15, 29, 22]

hot_f = [c * 9 / 5 + 32 for c in temps_c if c >= 25]

print("高溫華氏列表：", hot_f)`,
        hint: '先檢查 `if c >= 25`，再把符合條件的 `c` 代入 `c * 9 / 5 + 32`。',
        tests: [
          {
            id: 't1',
            label: '驗證篩選與溫度轉換',
            description: '26, 31, 29 轉為華氏 [78.8, 87.8, 84.2]',
            expectedSummary: '[78.8, 87.8, 84.2]',
            testCode: `assert hot_f == [78.8, 87.8, 84.2], f"預期 [78.8, 87.8, 84.2]，實際為 {hot_f}"`,
          },
        ],
      },
      {
        id: '4-3',
        moduleId: 'm4',
        moduleTitle: '串列與字典資料結構',
        orderLabel: '4.3',
        title: '字典 (dict) 鍵值統計實戰',
        durationLabel: '14 分鐘',
        difficultyLabel: '中階',
        summary: '字典以 `鍵 (Key): 值 (Value)` 成對儲存資料，查詢時間複雜度為 O(1)。是實作計數器、快取與資料分組的最佳利器。',
        conceptPoints: [
          '使用 `counts.get(key, 0)` 可在鍵不存在時安全回傳預設值 `0`，避免 `KeyError`。',
          '在「執行視覺化」可清楚看見字典物件如何動態新增鍵並遞增數值。',
        ],
        starterCode: `votes = ["Python", "Rust", "Python", "Go", "Python", "Rust"]
counts = {}

for lang in votes:
    counts[lang] = counts.get(lang, 0) + 1

print("投票統計：", counts)`,
        solutionCode: `votes = ["Python", "Rust", "Python", "Go", "Python", "Rust"]
counts = {}

for lang in votes:
    counts[lang] = counts.get(lang, 0) + 1

print("投票統計：", counts)`,
        hint: '`counts.get(lang, 0) + 1` 會取出目前票數並加 1，若尚未出現過則從 0 加起。',
        tests: [
          {
            id: 't1',
            label: '驗證統計字典內容',
            description: 'Python: 3, Rust: 2, Go: 1',
            expectedSummary: "{'Python': 3, 'Rust': 2, 'Go': 1}",
            testCode: `assert counts == {"Python": 3, "Rust": 2, "Go": 1}, f"實際為 {counts}"`,
          },
        ],
      },
    ],
  },
  {
    id: 'm5',
    order: '05',
    title: '函式設計與遞迴堆疊',
    subtitle: '拆解呼叫堆疊 (Call Stack)、區域變數作用域與遞迴回傳',
    lessons: [
      {
        id: '5-1',
        moduleId: 'm5',
        moduleTitle: '函式設計與遞迴堆疊',
        orderLabel: '5.1',
        title: '函式作用域與呼叫堆疊入門',
        durationLabel: '12 分鐘',
        difficultyLabel: '中階',
        summary: '每次呼叫函式時，Python 都會在呼叫堆疊 (Call Stack) 頂端建立一個獨立的區域框架，函式內的區域變數不會直接污染全域環境。',
        conceptPoints: [
          '使用 `return` 將計算結果交還給呼叫者，同時釋放該函式的區域堆疊框架。',
          '請切換至「執行視覺化」，觀察 `calc_bmi()` 被呼叫與返回時堆疊的堆疊高度變化。',
        ],
        starterCode: `def calc_bmi(weight_kg, height_cm):
    height_m = height_cm / 100
    bmi = weight_kg / (height_m ** 2)
    return round(bmi, 1)

result = calc_bmi(68, 175)
print("BMI 指數：", result)`,
        solutionCode: `def calc_bmi(weight_kg, height_cm):
    height_m = height_cm / 100
    bmi = weight_kg / (height_m ** 2)
    return round(bmi, 1)

result = calc_bmi(68, 175)
print("BMI 指數：", result)`,
        hint: '注意函式內的 `height_m` 與 `bmi` 只存在於函式執行期間的堆疊框架中。',
        tests: [
          {
            id: 't1',
            label: '驗證 calc_bmi 回傳結果',
            description: '68kg / 175cm 應為 22.2',
            expectedSummary: 'calc_bmi(68, 175) == 22.2',
            testCode: `assert calc_bmi(68, 175) == 22.2, f"實際為 {calc_bmi(68, 175)}"
assert calc_bmi(50, 160) == 19.5, f"實際為 {calc_bmi(50, 160)}"`,
          },
        ],
      },
      {
        id: '5-2',
        moduleId: 'm5',
        moduleTitle: '函式設計與遞迴堆疊',
        orderLabel: '5.2',
        title: '遞迴呼叫堆疊視覺化：階乘計算',
        durationLabel: '15 分鐘',
        difficultyLabel: '進階',
        summary: '遞迴 (Recursion) 是函式呼叫自己的技巧，必須包含「終止條件 (Base Case)」與「向終止條件收斂的遞迴步驟」。',
        conceptPoints: [
          '若沒有 Base Case，呼叫堆疊會無限增長直到觸發 `RecursionError`。',
          '點擊「單步追蹤」，你將親眼看見 `factorial(4) -> (3) -> (2) -> (1)` 層層疊起，再逐層回傳乘積！',
        ],
        explorerKind: 'recursion',
        starterCode: `def factorial(n):
    if n <= 1:
        return 1
    sub = factorial(n - 1)
    return n * sub

ans = factorial(4)
print("4! =", ans)`,
        solutionCode: `def factorial(n):
    if n <= 1:
        return 1
    sub = factorial(n - 1)
    return n * sub

ans = factorial(4)
print("4! =", ans)`,
        hint: '把計算結果暫存在 `sub = factorial(n - 1)`，在單步視覺化中能更清楚看到每層框架收到的回傳值。',
        tests: [
          {
            id: 't1',
            label: '驗證階乘測試案例',
            description: 'factorial(0)==1, factorial(4)==24, factorial(5)==120',
            expectedSummary: '0! = 1, 4! = 24, 5! = 120',
            testCode: `assert factorial(0) == 1, "0! 應為 1"
assert factorial(4) == 24, "4! 應為 24"
assert factorial(5) == 120, "5! 應為 120"`,
          },
        ],
      },
      {
        id: '5-3',
        moduleId: 'm5',
        moduleTitle: '函式設計與遞迴堆疊',
        orderLabel: '5.3',
        title: '演算法挑戰：二分搜尋 (Binary Search)',
        durationLabel: '15 分鐘',
        difficultyLabel: '進階',
        summary: '針對已排序的串列，每次比較中間值並捨棄一半搜尋區間，只需 O(log n) 步驟就能找到目標索引。',
        conceptPoints: [
          '維護 `left` 與 `right` 雙指標，取中點 `mid = (left + right) // 2`。',
          '透過單步視覺化觀察 `left`、`mid`、`right` 如何迅速夾逼目標數值。',
        ],
        starterCode: `def binary_search(nums, target):
    left = 0
    right = len(nums) - 1
    while left <= right:
        mid = (left + right) // 2
        if nums[mid] == target:
            return mid
        elif nums[mid] < target:
            left = mid + 1
        else:
            right = mid - 1
    return -1

data = [3, 8, 12, 19, 25, 34, 42, 58]
idx = binary_search(data, 34)
print("34 位於索引：", idx)`,
        solutionCode: `def binary_search(nums, target):
    left = 0
    right = len(nums) - 1
    while left <= right:
        mid = (left + right) // 2
        if nums[mid] == target:
            return mid
        elif nums[mid] < target:
            left = mid + 1
        else:
            right = mid - 1
    return -1

data = [3, 8, 12, 19, 25, 34, 42, 58]
idx = binary_search(data, 34)
print("34 位於索引：", idx)`,
        hint: '若目標不在串列中，迴圈結束後應回傳 `-1`。',
        tests: [
          {
            id: 't1',
            label: '驗證存在元素索引',
            description: '搜尋 34 應回傳 5，搜尋 3 應回傳 0',
            expectedSummary: '索引 5 與 0',
            testCode: `assert binary_search([3, 8, 12, 19, 25, 34, 42, 58], 34) == 5
assert binary_search([3, 8, 12, 19, 25, 34, 42, 58], 3) == 0`,
          },
          {
            id: 't2',
            label: '驗證不存在元素處理',
            description: '搜尋 20 應回傳 -1',
            expectedSummary: '回傳 -1',
            testCode: `assert binary_search([3, 8, 12, 19, 25, 34, 42, 58], 20) == -1`,
          },
        ],
      },
    ],
  },
];

export const ALL_LESSONS: Lesson[] = MODULES.flatMap((m) => m.lessons);

export const SANDBOX_PRESETS: SandboxPreset[] = [
  {
    id: 'bubble-sort',
    title: '氣泡排序追蹤',
    category: '排序演算法',
    description: '用單步視覺化觀察相鄰元素如何逐輪交換並將最大值推向尾端。',
    code: `nums = [29, 10, 14, 37, 13]
n = len(nums)

for i in range(n - 1):
    for j in range(n - 1 - i):
        if nums[j] > nums[j + 1]:
            nums[j], nums[j + 1] = nums[j + 1], nums[j]

print("排序結果：", nums)`,
  },
  {
    id: 'fibonacci-rec',
    title: '費氏數列遞迴樹',
    category: '遞迴與堆疊',
    description: '觀察 `fib(5)` 展開呼叫堆疊的過程與回傳數值聚合。',
    code: `def fib(n):
    if n <= 1:
        return n
    a = fib(n - 1)
    b = fib(n - 2)
    return a + b

result = fib(5)
print("fib(5) =", result)`,
  },
  {
    id: 'prime-sieve',
    title: '質數篩選器',
    category: '數論與推導式',
    description: '找出 2 到 40 之間的所有質數並統計數量。',
    code: `primes = []
for num in range(2, 41):
    is_prime = True
    for d in range(2, int(num ** 0.5) + 1):
        if num % d == 0:
            is_prime = False
            break
    if is_prime:
        primes.append(num)

print("質數列表：", primes)
print("共找到：", len(primes), "個質數")`,
  },
  {
    id: 'interactive-input',
    title: '標準輸入 input() 練習',
    category: '互動 I/O',
    description: '透過輸入資料列測試 `input()` 讀取使用者名稱與分數的流程。',
    stdin: '林小安\n92',
    code: `name = input("請輸入姓名：")
score = int(input("請輸入分數："))

grade = "優秀" if score >= 90 else "及格" if score >= 60 else "再加油"
print(f"{name} 同學，你的成績為 {score} 分（{grade}）")`,
  },
];
