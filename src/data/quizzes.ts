import type { QuizQuestion } from '../types/python';

export const CONCEPT_QUIZZES: QuizQuestion[] = [
  {
    id: 'q1',
    topic: '串列參照與可變物件',
    difficulty: '基礎觀念',
    prompt: '執行以下程式碼後，終端機輸出的結果為何？',
    code: `a = [1, 2, 3]
b = a
b.append(4)
print(a)`,
    options: ['[1, 2, 3]', '[1, 2, 3, 4]', '[4, 1, 2, 3]', '發生 TypeError 錯誤'],
    correctIndex: 1,
    explanation:
      '在 Python 中，`b = a` 並不會複製串列，而是讓 `a` 與 `b` 指向記憶體中的「同一個」串列物件，因此透過 `b.append(4)` 修改後，`a` 也會反映出 `[1, 2, 3, 4]`。若想建立獨立副本，應寫成 `b = a.copy()` 或 `b = a[:]`。',
  },
  {
    id: 'q2',
    topic: 'range() 半開區間邊界',
    difficulty: '入門觀念',
    prompt: '這段迴圈總共會執行幾次 `print`？',
    code: `for i in range(2, 10, 3):
    print(i)`,
    options: ['2 次', '3 次', '4 次', '5 次'],
    correctIndex: 1,
    explanation:
      '`range(2, 10, 3)` 從 2 開始，每次加 3，直到小於 10 為止：依序產生 `2, 5, 8`（下一個數字 11 已超過 10），因此共執行 3 次。',
  },
  {
    id: 'q3',
    topic: '切片 Slicing 與負索引',
    difficulty: '基礎觀念',
    prompt: '請問 `word[1:-1]` 會回傳哪一個字串？',
    code: `word = "PYTHON"
print(word[1:-1])`,
    options: ['"PYTHO"', '"YTHO"', '"YTHON"', '"PYTH"'],
    correctIndex: 1,
    explanation:
      '索引 `1` 指向字元 `"Y"`，負索引 `-1` 指向最後一個字元 `"N"`。由於切片不包含終點位置，因此會取出索引 1 到倒數第二個字元，得到 `"YTHO"`。',
  },
  {
    id: 'q4',
    topic: '函式區域變數作用域',
    difficulty: '進階觀念',
    prompt: '執行這段程式碼後，最後一行 `print(x)` 會輸出什麼？',
    code: `x = 10
def change(val):
    x = val * 2
    return x

y = change(5)
print(x, y)`,
    options: ['10 10', '5 10', '10 5', '20 10'],
    correctIndex: 0,
    explanation:
      '函式內部的 `x = val * 2` 建立的是「區域變數 `x`」，它只存在於 `change()` 的堆疊框架中，不會覆寫外層的全域變數 `x = 10`。因此外層的 `x` 依然是 `10`，而接收回傳值的 `y` 也是 `10`。',
  },
  {
    id: 'q5',
    topic: '整數除法與餘數',
    difficulty: '入門觀念',
    prompt: '下列運算式的最終結果為何？',
    code: `result = 17 // 5 + 17 % 5
print(result)`,
    options: ['5.4', '5', '6', '7'],
    correctIndex: 1,
    explanation:
      '`17 // 5` 的整數商數為 `3`，而 `17 % 5` 的餘數為 `2`。兩者相加 `3 + 2` 結果為整數 `5`。',
  },
  {
    id: 'q6',
    topic: '字典安全查詢 .get()',
    difficulty: '基礎觀念',
    prompt: '執行以下程式碼後，變數 `score` 的值為何？',
    code: `scores = {"Alice": 90, "Bob": 82}
score = scores.get("Charlie", 60)
print(score)`,
    options: ['None', '0', '60', '引發 KeyError'],
    correctIndex: 2,
    explanation:
      '使用 `dict.get(key, default)` 查詢不存在的鍵 `"Charlie"` 時，不會引發 `KeyError`，而是回傳第二個參數指定的預設值 `60`。',
  },
];
