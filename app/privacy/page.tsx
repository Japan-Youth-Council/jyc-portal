export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 flex justify-center">
      <div className="w-full max-w-3xl bg-white p-8 sm:p-10 rounded-2xl shadow-sm border border-gray-300">
        <h1 className="text-2xl sm:text-3xl font-bold text-black mb-8 border-b-2 border-gray-100 pb-4">
          プライバシーポリシー
        </h1>
        
        <div className="space-y-8 text-black text-sm sm:text-base leading-relaxed font-medium">
          <section>
            <h2 className="text-lg font-bold mb-3">1. 取得する情報</h2>
            <p>日本若者協議会（以下「当団体」）は、JYC Portal（以下「本システム」）において以下の情報を取得します。</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Googleアカウント情報（メールアドレス、氏名、プロフィール画像）</li>
              <li>ユーザーが自発的に入力したプロフィール情報（居住地、所属プロジェクト、活動目標など）</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold mb-3">2. 利用目的</h2>
            <p>取得した個人情報は、以下の目的で利用します。</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>本システムへのログイン認証およびアカウント管理のため</li>
              <li>当団体内のプロジェクト運営およびメンバー間の円滑なコミュニケーションのため</li>
              <li>本システムの機能提供およびセキュリティ維持のため</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold mb-3">3. 第三者への提供</h2>
            <p>当団体は、法令に定める場合を除き、ユーザー本人の同意を得ることなく第三者に個人情報を提供することはありません。</p>
          </section>

          <section>
            <h2 className="text-lg font-bold mb-3">4. 情報の管理と保護</h2>
            <p>取得した情報は、不正アクセスやデータ漏洩を防ぐため、適切なセキュリティ対策（クラウドデータベースでの安全な保管等）を講じて管理します。</p>
          </section>

          <section>
            <h2 className="text-lg font-bold mb-3">5. お問い合わせ窓口</h2>
            <p>本ポリシーに関するお問い合わせ、または個人情報の修正・削除依頼は、本システム管理者までご連絡ください。</p>
          </section>
        </div>
      </div>
    </div>
  );
}