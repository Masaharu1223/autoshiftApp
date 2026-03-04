# シーケンス図

## 1. 出勤人数一括設定

```mermaid
sequenceDiagram
    actor User
    participant Page as StaffingPage<br/>(Server Component)
    participant Table as StaffingTable<br/>(Client Component)
    participant API as bulkUpdateDayConfigs()
    participant DB as Supabase

    User->>Page: /staffing/YYYY/MM にアクセス
    Page->>API: getDayConfigs(year, month)
    API->>DB: getOrCreateShift + SELECT shift_day_configs
    DB-->>API: shift + configs
    API-->>Page: { shiftId, configs, daysInMonth }
    Page-->>User: StaffingTable を表示

    User->>Table: 各日の最小/最大人数・休業を編集
    User->>Table: 「一括保存」クリック
    Table->>Table: バリデーション(min≥0, max≥min)
    Table->>API: bulkUpdateDayConfigs(shiftId, year, month, configs[])
    API->>DB: UPSERT shift_day_configs (全日分)
    API->>API: revalidatePath(/shifts, /staffing)
    DB-->>API: OK
    API-->>Table: 完了
    Table-->>User: 「保存しました」表示
```

## 2. シフト自動最適化

```mermaid
sequenceDiagram
    actor User
    participant UI as ShiftControls
    participant Opt as optimizeMonth()
    participant API as saveOptimizedAssignments()
    participant DB as Supabase

    User->>UI: 「自動最適化」クリック
    UI->>UI: startTransition開始
    UI->>Opt: optimizeMonth(members, days, ...)
    loop 各日(休業日除く)
        Opt->>Opt: optimizeDay(available, locked, min, day, max)
        Note over Opt: C(N,k)≤10,000 → 全探索<br/>それ以上 → Greedy
    end
    Opt-->>UI: OptimizationResult[]
    UI->>API: saveOptimizedAssignments(shiftId, year, month, results)
    API->>DB: DELETE auto-assigned records
    API->>DB: INSERT new assignments
    API->>API: revalidatePath(/shifts/YYYY/M)
    DB-->>API: OK
    API-->>UI: 完了
    UI-->>User: カレンダー再描画
```

## 3. メンバー手動アサイン

```mermaid
sequenceDiagram
    actor User
    participant Picker as MemberPickerPanel
    participant API as addManualAssignment()
    participant DB as Supabase

    User->>Picker: + ボタンクリック
    Picker->>Picker: モーダル表示(未アサインメンバー一覧)
    User->>Picker: メンバー選択
    Picker->>API: addManualAssignment(shiftId, year, month, day, memberId)
    API->>DB: INSERT shift_assignments (is_auto_assigned=false)
    API->>API: revalidatePath(/shifts/YYYY/M)
    DB-->>API: OK
    API-->>Picker: 完了
    Picker-->>User: モーダル閉じる → チップ追加
```
