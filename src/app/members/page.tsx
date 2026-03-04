import { getMembers, getAbilityDefinitions } from "@/lib/api/members";
import { MemberList } from "@/components/members/MemberList";
import { MemberForm } from "@/components/members/MemberForm";

export default async function MembersPage() {
  const [members, abilityDefs] = await Promise.all([
    getMembers(),
    getAbilityDefinitions(),
  ]);

  return (
    <div className="max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">メンバー管理</h1>
        <p className="text-sm text-gray-500">
          スタッフの登録と能力値を設定します
        </p>
      </div>

      <div className="mb-6">
        <MemberForm />
      </div>

      <MemberList members={members} abilityDefs={abilityDefs} />
    </div>
  );
}
