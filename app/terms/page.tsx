export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 flex justify-center">
      <div className="w-full max-w-3xl bg-white p-8 sm:p-10 rounded-2xl shadow-sm border border-gray-300">
        <h1 className="text-2xl sm:text-3xl font-bold text-black mb-8 border-b-2 border-gray-100 pb-4">
          利用規約
        </h1>
        
        <div className="space-y-8 text-black text-sm sm:text-base leading-relaxed font-medium">
          <p>
            この利用規約（以下「本規約」）は、日本若者協議会（以下「当団体」）が提供する JYC Portal（以下「本システム」）の利用条件を定めるものです。ユーザーは本規約に同意した上で本システムを利用するものとします。
          </p>

          <section>
            <h2 className="text-lg font-bold mb-3">1. 利用資格</h2>
            <p>本システムは、原則として当団体の会員、または当団体が利用を許可した関係者のみが利用できるものとします。</p>
          </section>

          <section>
            <h2 className="text-lg font-bold mb-3">2. 守秘義務</h2>
            <p>ユーザーは、本システムを通じて知り得た他のユーザーの個人情報、プロジェクトの未公開情報、およびその他の機密情報を、当団体の許可なく外部に漏洩、公開、または第三者に提供してはなりません。</p>
          </section>

          <section>
            <h2 className="text-lg font-bold mb-3">3. 禁止事項</h2>
            <p>本システムの利用にあたり、以下の行為を禁止します。</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>法令または公序良俗に違反する行為</li>
              <li>当団体、他のユーザー、または第三者の権利を侵害する行為</li>
              <li>本システムの運営を妨害する、またはそのおそれのある行為</li>
              <li>他のユーザーのアカウントを不正に使用する行為</li>
              <li>その他、当団体が不適切と判断する行為</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold mb-3">4. アカウントの停止</h2>
            <p>当団体は、ユーザーが本規約に違反したと判断した場合、事前の通知なく当該ユーザーのアカウント利用を停止、または削除することができるものとします。</p>
          </section>

          <section>
            <h2 className="text-lg font-bold mb-3">5. 免責事項</h2>
            <p>当団体は、本システムの利用によりユーザーに生じた損害について、当団体に故意または重大な過失がある場合を除き、一切の責任を負わないものとします。</p>
          </section>

          <section>
            <h2 className="text-lg font-bold mb-3">6. 規約の変更</h2>
            <p>当団体は、必要と判断した場合には、ユーザーに通知することなくいつでも本規約を変更することができるものとします。変更後の規約は、本システム上に掲示された時点で効力を生じるものとします。</p>
          </section>
        </div>
      </div>
    </div>
  );
}