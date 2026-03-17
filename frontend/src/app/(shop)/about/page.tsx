import React from "react";

export default function AboutPage() {
  return (
    <main className="flex-grow">
      {/* Hero Section */}
      <section className="relative h-[600px] flex items-center justify-center overflow-hidden">
        <img
          alt="Himalayan salt mines landscape"
          className="absolute inset-0 w-full h-full object-cover"
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuDVb5snd4NrfMMvwDZSLOp5mcaVl5dSG4U1CgGsXjpRO8Z5ENzGP4nd9-6LbLqKCSABmu4LavvE8-1q0wJQmotb122D01V8Cmi4zL33vlxAkvG8fu3HBgOdLaLlSqfuMfYk7J0CEVkC4Q8YgtxIg2JcxpT7HDGdAnipNHueYu0tNQ4vOJvV23hiVSck-Mvc8cJsauRzFwdtofqxLtuakNFh0Rp8bPOJQZMDxZrTfQein8bkUFoBbJdI2w66ia4JQP3674WPnIjgIWT9"
        />
        <div className="absolute inset-0 bg-black/40"></div>
        <div className="relative z-10 text-center px-4 max-w-4xl">
          <h2 className="text-4xl md:text-6xl font-serif text-white leading-tight mb-6">
            Hành trình mang ánh sáng chữa lành từ dãy Himalaya
          </h2>
          <p className="text-lg md:text-xl text-stone-100 font-light max-w-2xl mx-auto italic">
            Khám phá nguồn năng lượng tự nhiên được kết tinh qua hàng triệu năm.
          </p>
        </div>
      </section>

      {/* Story Section */}
      <section className="py-24 px-6 lg:px-24 bg-[#FDFBF7]">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="relative">
            <div className="aspect-[4/5] rounded-2xl overflow-hidden shadow-2xl rotate-2">
              <img
                alt="Natural salt stones close up"
                className="w-full h-full object-cover"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuCQm5UD7eIXnYtE9iMA_J7jRH7hCSl_pe0_uCy2STCFr5MrePeRomb8pUXXS-dyl_pCbhas5FmxWGFvFTpe_yXzLYSIZT0D81BmqZXcHE0YHn1OUz7Gvxwdzo4V46bfeZyg1OTf2Xn9xTTg4298PJLd9eIEKPBOpMhoBQNmz5PfQe2CNPylYtvldJS145ccgX_G_MbOhewhs7VtBnavttrt1ZiomPkJVCI4_4hULjV63WCaoVL5nIqUqwV3WZDIkcboe_vuBMKUEUM1"
              />
            </div>
            <div className="absolute -bottom-6 -left-6 aspect-square w-48 rounded-2xl overflow-hidden shadow-xl border-8 border-white -rotate-3 hidden md:block">
              <img
                alt="Raw salt formation"
                className="w-full h-full object-cover"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuAGfjYO8mStWQ37tewab53RBT0oA0W7NPl_iOQ42fws6KX29go8SEBuD2n5fkaL6an4q5KrTInlaSpNypoy213LyJdIq19FUkNF5A-0Y88uKhL0QuH2YCFSFQnz4A4FDob-OFF9p_dTlc-2QDs801Vodf7FS3cY8Bj9-ktfTsnJKChQ4S5uHkU6ZEc_wZHNZ8Ii8snMl7hgYMCFPT_JaIA-4wiLDRnuhyn9HRBkvoDokTb-QMvnC06yhpvc7dmhAOYScoDPHbndZzbt"
              />
            </div>
          </div>
          <div className="flex flex-col gap-6">
            <span className="text-primary font-bold tracking-[0.2em] uppercase text-sm">
              Câu chuyện của chúng tôi
            </span>
            <h3 className="text-3xl md:text-4xl font-serif text-stone-900 leading-snug">
              Mang năng lượng tự nhiên vào không gian sống hiện đại
            </h3>
            <div className="space-y-4 text-stone-600 leading-relaxed text-lg">
              <p>
                Himalaya Salt ra đời từ niềm đam mê với vẻ đẹp hoang sơ và khả
                năng chữa lành kỳ diệu của những khối đá muối hồng vùng Punjab.
                Chúng tôi tin rằng, giữa nhịp sống hối hả, mỗi ngôi nhà đều cần
                một góc nhỏ bình yên để tái tạo năng lượng.
              </p>
              <p>
                Hành trình của chúng tôi bắt đầu từ những chuyến đi thực tế đến
                chân dãy Himalaya, nơi những khối đá muối tinh khiết nhất được
                khai thác. Chúng tôi cam kết mang đến những sản phẩm không chỉ
                là vật trang trí, mà còn là người bạn đồng hành cho sức khỏe và
                tinh thần của gia đình bạn.
              </p>
            </div>
            <div className="pt-4">
              <div className="flex items-center gap-4">
                <div className="size-12 rounded-full overflow-hidden bg-stone-200">
                  <img
                    alt="Founder"
                    className="w-full h-full object-cover"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuAGfjYO8mStWQ37tewab53RBT0oA0W7NPl_iOQ42fws6KX29go8SEBuD2n5fkaL6an4q5KrTInlaSpNypoy213LyJdIq19FUkNF5A-0Y88uKhL0QuH2YCFSFQnz4A4FDob-OFF9p_dTlc-2QDs801Vodf7FS3cY8Bj9-ktfTsnJKChQ4S5uHkU6ZEc_wZHNZ8Ii8snMl7hgYMCFPT_JaIA-4wiLDRnuhyn9HRBkvoDokTb-QMvnC06yhpvc7dmhAOYScoDPHbndZzbt"
                  />
                </div>
                <div>
                  <p className="font-bold text-stone-900">Hoàng Văn Quang </p>
                  <p className="text-sm text-stone-500 italic">
                    Người sáng lập Himalaya Salt
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Core Values Section */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 text-center">
          <h3 className="text-3xl font-serif mb-16">Giá trị cốt lõi</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="flex flex-col items-center gap-4 group">
              <div className="size-20 bg-primary/10 rounded-full flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all duration-300">
                <span className="material-symbols-outlined text-4xl">eco</span>
              </div>
              <h4 className="text-xl font-bold font-serif">Tự nhiên 100%</h4>
              <p className="text-stone-500 leading-relaxed p-4">
                Đá muối hồng nguyên bản được khai thác trực tiếp từ mỏ đá muối
                Himalaya lâu đời, không qua xử lý hóa chất.
              </p>
            </div>
            <div className="flex flex-col items-center gap-4 group">
              <div className="size-20 bg-primary/10 rounded-full flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all duration-300">
                <span className="material-symbols-outlined text-4xl">
                  precision_manufacturing
                </span>
              </div>
              <h4 className="text-xl font-bold font-serif">Chế tác thủ công</h4>
              <p className="text-stone-500 leading-relaxed p-4">
                Mỗi chiếc đèn là một tác phẩm nghệ thuật duy nhất, được gọt giũa
                tỉ mỉ bởi đôi bàn tay của các nghệ nhân lành nghề.
              </p>
            </div>
            <div className="flex flex-col items-center gap-4 group">
              <div className="size-20 bg-primary/10 rounded-full flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all duration-300">
                <span className="material-symbols-outlined text-4xl">
                  volunteer_activism
                </span>
              </div>
              <h4 className="text-xl font-bold font-serif">Tận tâm phục vụ</h4>
              <p className="text-stone-500 leading-relaxed p-4">
                Chúng tôi luôn lắng nghe và chăm sóc từng khách hàng như người
                thân, đảm bảo trải nghiệm mua sắm ấm áp nhất.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-[#FDFBF7] text-center px-6">
        <div className="max-w-3xl mx-auto bg-white p-12 rounded-3xl shadow-xl border border-stone-100">
          <h3 className="text-3xl font-serif text-stone-900 mb-6">
            Sẵn sàng để sở hữu ánh sáng chữa lành?
          </h3>
          <p className="text-stone-600 mb-10 text-lg">
            Khám phá bộ sưu tập đèn đá muối đa dạng để tìm thấy mảnh ghép hoàn
            hảo cho không gian của bạn.
          </p>
          <a
            className="inline-flex items-center justify-center px-10 py-4 bg-primary hover:bg-primary/90 text-white font-bold rounded-full transition-all transform hover:scale-105 shadow-lg shadow-primary/30"
            href="/?category=all"
          >
            Xem sản phẩm
            <span className="material-symbols-outlined ml-2 text-xl">
              arrow_right_alt
            </span>
          </a>
        </div>
      </section>
    </main>
  );
}
