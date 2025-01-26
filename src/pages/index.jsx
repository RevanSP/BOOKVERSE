import Layout from "../layout/Layout";

function IndexPage() {

  const features = [
    {
      icon: "bi-journal-text",
      title: "Start Reading",
      description: "Click on any manga, manhua, or manhwa and start reading instantly without waiting."
    },
    {
      icon: "bi-patch-check",
      title: "Enjoy Seamlessly",
      description: "Sit back, relax, and enjoy a seamless reading experience."
    },
    {
      icon: "bi-search",
      title: "Browse Content",
      description: "Find your favorite manga, manhua, or manhwa quickly with our easy-to-use search features."
    },
    {
      icon: "bi-bookmark-check",
      title: "Readlist",
      description: "Save your favorite manga, manhua, and manhwa for easy access later."
    },
    {
      icon: "bi-shield-check",
      title: "Secure Reading",
      description: "Your reading experience is always protected with our state-of-the-art security measures."
    },
    {
      icon: "bi-laptop",
      title: "Cross-Platform Support",
      description: "Read on any device—whether it’s your phone, tablet, or desktop."
    }
  ];

  return <Layout>
    <section className="py-10">
      <div className="container mx-auto px-8">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-12">
          {features.map((feature, index) => (
            <div className="text-center" key={index}>
              <div className="bg-green rounded-full p-6 inline-block mb-4">
                <i className={`bi ${feature.icon} text-5xl text-black`}></i>
              </div>
              <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
              <p className="text-gray-600">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  </Layout>;
}

export default IndexPage;