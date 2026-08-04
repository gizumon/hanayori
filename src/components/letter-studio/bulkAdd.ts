import type { BulkCreateLetter, Honor } from "./types";

/**
 * 一括追加の CSV まわり。宛名以外にどの項目を読み込むかを選べるようにして、
 * 「宛名, 席札の氏名, 卓番, …」のような CSV を貼れるようにする。
 *
 * 1 列目は必ず宛名。2 列目以降は画面で選んだ項目の並び順どおりに読む。
 */

/** 一括追加で選べる項目(宛名以外)。 */
export type BulkAddField =
  | "cardName"
  | "honor"
  | "tableNo"
  | "escortName"
  | "escortMessage"
  | "escortHonor";

/** 一度に追加できる上限。サーバー側の上限(MAX_BULK_CREATE)と同じ値。 */
export const MAX_BULK_ADD = 200;

export interface BulkAddColumn {
  key: BulkAddField;
  label: string;
  /** どのカードの項目か。共通設定でそのカードを使わない設定なら選べない。 */
  scope: "card" | "escort";
  /** placeholder の例に使う値。3 行ぶん。 */
  samples: [string, string, string];
  /**
   * CSV のセルを手紙のフィールドに直す。空欄は null(= 未設定)にして、
   * あとから個別編集で埋められる状態にする。
   */
  parse: (raw: string) => { value: string | null } | { error: string };
}

/** 敬称セルの受け付ける書き方。空欄はイベント既定に従う(null)。 */
const HONOR_WORDS: Record<string, Honor> = {
  様: "様",
  さま: "様",
  さん: "さん",
  なし: "",
  無し: "",
  "-": "",
};

function parseHonorCell(raw: string): { value: string | null } | { error: string } {
  const v = raw.trim();
  if (!v) return { value: null };
  const honor = HONOR_WORDS[v];
  if (honor === undefined) {
    return { error: "「様」「さん」「なし」または空欄にしてください" };
  }
  return { value: honor };
}

function parseTextCell(raw: string): { value: string | null } {
  const v = raw.trim();
  return { value: v || null };
}

/** 宛名(1 列目)。固定なので選択肢には出さない。 */
export const TO_COLUMN = {
  label: "宛名",
  samples: ["山田花子へ", "佐藤太郎へ", "鈴木一郎へ"] as const,
};

export const BULK_ADD_COLUMNS: BulkAddColumn[] = [
  {
    key: "cardName",
    label: "席札の氏名",
    scope: "card",
    samples: ["山田 花子", "佐藤 太郎", "鈴木 一郎"],
    parse: parseTextCell,
  },
  {
    key: "honor",
    label: "席札の敬称",
    scope: "card",
    samples: ["様", "様", "さん"],
    parse: parseHonorCell,
  },
  {
    key: "tableNo",
    label: "卓番",
    scope: "escort",
    samples: ["A", "B", "A"],
    parse: parseTextCell,
  },
  {
    key: "escortName",
    label: "エスコート名",
    scope: "escort",
    samples: ["山田 花子", "佐藤 太郎", "鈴木 一郎"],
    parse: parseTextCell,
  },
  {
    key: "escortMessage",
    label: "一言",
    scope: "escort",
    samples: ["今日はよろしくね", "来てくれてありがとう", "ゆっくり楽しんでね"],
    parse: parseTextCell,
  },
  {
    key: "escortHonor",
    label: "エスコートの敬称",
    scope: "escort",
    samples: ["様", "様", "さん"],
    parse: parseHonorCell,
  },
];

/** 席札・エスコートカードを使う設定のときだけ、その項目を選べるようにする。 */
export function availableColumns(cardEnabled: boolean, escortEnabled: boolean): BulkAddColumn[] {
  return BULK_ADD_COLUMNS.filter((c) =>
    c.scope === "card" ? cardEnabled : escortEnabled
  );
}

export function columnOf(key: BulkAddField): BulkAddColumn {
  return BULK_ADD_COLUMNS.find((c) => c.key === key)!;
}

/**
 * CSV の 1 行をセルに分ける。`"` で囲めばカンマを含められ、囲みの中の `""` は
 * `"` 1 文字。区切りは半角・全角どちらのカンマでも受ける(「、」は文中に出るので
 * 区切りにしない)。引用符が閉じていない行は null を返す。
 */
export function splitCsvLine(line: string): string[] | null {
  const cells: string[] = [];
  let cur = "";
  let quoted = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (quoted) {
      if (ch !== '"') {
        cur += ch;
      } else if (line[i + 1] === '"') {
        cur += '"';
        i++;
      } else {
        quoted = false;
      }
      continue;
    }
    if (ch === '"' && cur.trim() === "") {
      // 引用の開始。前に空白しか無いときだけ囲みとして扱う。
      quoted = true;
      cur = "";
    } else if (ch === "," || ch === "，") {
      cells.push(cur);
      cur = "";
    } else {
      cur += ch;
    }
  }
  if (quoted) return null;
  cells.push(cur);
  return cells;
}

/** 直せる場所が分かるよう、エラーは入力欄の行番号つきで返す。 */
export interface BulkAddIssue {
  /** テキストエリア上の行番号(1 始まり)。0 = 入力全体に対する指摘。 */
  line: number;
  message: string;
}

export interface BulkAddParsed {
  /** そのまま作成に送れる行。エラーが 1 件でもあれば送らない。 */
  rows: BulkCreateLetter[];
  errors: BulkAddIssue[];
  /** 追加は止めないが目を通してほしいこと(宛名の重複など)。 */
  warnings: string[];
}

/**
 * 貼り付けたテキストを読む。空行は捨て、1 行 = 1 通として
 * 「宛名, 選んだ項目…」の順に読む。
 */
export function parseBulkAddText(text: string, fields: BulkAddField[]): BulkAddParsed {
  const columns = fields.map(columnOf);
  const width = columns.length + 1;
  const rows: BulkCreateLetter[] = [];
  const errors: BulkAddIssue[] = [];
  const warnings: string[] = [];
  const seen = new Map<string, number>();

  const lines = text.split("\n");
  // 表計算ソフトからの貼り付けを想定して、1 行目が「宛名, …」なら見出しとして飛ばす。
  const firstIdx = lines.findIndex((l) => l.trim());

  lines.forEach((line, i) => {
    const lineNo = i + 1;
    if (!line.trim()) return;

    const cells = splitCsvLine(line);
    if (i === firstIdx && cells && cells[0].trim() === TO_COLUMN.label) {
      warnings.push(`${lineNo}行目は見出しとして読み飛ばしました`);
      return;
    }
    if (!cells) {
      errors.push({ line: lineNo, message: '引用符 " が閉じていません' });
      return;
    }
    if (cells.length !== width) {
      errors.push({
        line: lineNo,
        message:
          width === 1
            ? "カンマが入っています。「入力する項目」を選ぶと2列目以降も読み込めます"
            : `項目が${cells.length}個です(${width}個で入力してください)`,
      });
      return;
    }

    const to = cells[0].trim();
    if (!to) {
      errors.push({ line: lineNo, message: "宛名が空です" });
      return;
    }
    seen.set(to, (seen.get(to) ?? 0) + 1);

    const values: Partial<Record<BulkAddField, string | null>> = {};
    let ok = true;
    columns.forEach((col, ci) => {
      const parsed = col.parse(cells[ci + 1]);
      if ("error" in parsed) {
        errors.push({ line: lineNo, message: `${col.label}: ${parsed.error}` });
        ok = false;
        return;
      }
      // 敬称は parse が Honor しか返さないので、ここで型を寄せて詰める。
      values[col.key] = parsed.value;
    });
    if (ok) rows.push({ to, ...values } as BulkCreateLetter);
  });

  if (rows.length > MAX_BULK_ADD) {
    errors.push({
      line: 0,
      message: `一度に追加できるのは${MAX_BULK_ADD}名までです(いまは${rows.length}名)`,
    });
  }

  const dupes = [...seen.entries()].filter(([, n]) => n > 1).map(([to]) => to);
  if (dupes.length > 0) {
    warnings.push(
      `同じ宛名が複数あります: ${dupes.slice(0, 3).join("、")}${
        dupes.length > 3 ? ` ほか${dupes.length - 3}件` : ""
      }`
    );
  }

  return { rows, errors, warnings };
}

/** 選んだ項目に合わせた入力例。そのまま貼れば通る形にしておく。 */
export function samplePlaceholder(fields: BulkAddField[]): string {
  const columns = fields.map(columnOf);
  return [0, 1, 2]
    .map((r) => [TO_COLUMN.samples[r], ...columns.map((c) => c.samples[r])].join(","))
    .join("\n");
}
