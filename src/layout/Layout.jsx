/* eslint-disable react/prop-types */
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const Layout = ({ children }) => {
  const [theme, setTheme] = useState(() => localStorage.getItem("theme") || "lofi");
  const [deferredPrompt, setDeferredPrompt] = useState(null);

  const toggleTheme = () => {
    const newTheme = theme === "black" ? "lofi" : "black";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
  };

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  useEffect(() => {
    if (!localStorage.getItem("modalShown")) {
      document.getElementById("notes").showModal();
    }
  }, []);

  const closeModal = () => {
    localStorage.setItem("modalShown", "true");
    document.getElementById("notes").close();
  };

  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then((choiceResult) => {
        console.log(choiceResult.outcome === 'accepted' ? 'User accepted the A2HS prompt' : 'User dismissed the A2HS prompt');

        setDeferredPrompt(null);

        const reinstallListener = (e) => {
          e.preventDefault();
          setDeferredPrompt(e);
          window.removeEventListener('beforeinstallprompt', reinstallListener);
        };
        window.addEventListener('beforeinstallprompt', reinstallListener);
      });
    }
  };

  const isActive = (path) => {
    if (path === '/') {
      return window.location.pathname === path;
    }

    return window.location.pathname.startsWith(path);
  };

  const isHomePage = window.location.pathname === "/";

  const socialLinks = [
    { icon: "bi-github", href: "https://github.com/RevanSP", label: "Github" },
    { icon: "bi-instagram", href: "https://www.instagram.com/m9nokuro/", label: "Instagram" },
    { icon: "bi-facebook", href: "https://web.facebook.com/profile.php?id=100082958149027&_rdc=1&_rdr", label: "Facebook" },
  ];

  return (
    <>
      <dialog id="notes" className="modal">
        <div className="modal-box border-green border-2 rounded-lg w-11/12 max-w-2xl">
          <form method="dialog">
            <button
              className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2 text-green"
              onClick={closeModal}
            >
              ✕
            </button>
          </form>
          <h3 className="font-bold text-lg mb-4">NOTES</h3>
          <p>
            In order for manga, manhua, and manhwa covers to appear and not be blank, you can change your DNS settings to Google&apos;s (Public DNS) in your browser settings.
          </p>
          <h4 className="font-semibold mt-4">Steps to Change DNS to Google Public DNS :</h4>
          <ol className="list-decimal pl-6 mt-2">
            <li>Open your browser settings.</li>
            <li>Go to the &quot;Network&quot; or &quot;Internet Settings&quot; section.</li>
            <li>Find and select the option for DNS settings.</li>
            <li>Set the DNS server addresses to the following:
              <ul className="pl-1 my-1">
                <li className="inline">
                  Google <strong>(Public DNS)</strong> or <span className="inline">{`https://dns.google/dns-query{?dns}`}</span>
                </li>
              </ul>
            </li>
            <li>Save the settings and restart your browser.</li>
          </ol>
        </div>
      </dialog>
      <div className="flex flex-col min-h-screen">
        <div className="navbar bg-base-100 fixed top-0 left-0 w-full z-50">
          <div className="flex-1 -ml-1">
            <a className="btn btn-ghost text-xl text-green">BOOKVERSE</a>
          </div>
          <div className="flex-none -mr-1">
            <button className="btn btn-ghost btn-circle" onClick={toggleTheme}>
              <i className={`bi ${theme === "black" ? "bi-brightness-high" : "bi-moon-stars"} text-green`}></i>
            </button>
          </div>
        </div>
        {isHomePage && (
          <div className="hero relative mt-16 md:min-h-screen" style={{ backgroundImage: "url(/herosection-d-alt.webp)" }}>
            <div className="absolute inset-0 bg-black opacity-70"></div>
            <div className="py-16 hero-content text-neutral-content text-center relative">
              <div className="max-w-md">
                <h1 className="mb-3 text-3xl font-bold text-green">BOOKVERSE</h1>
                <p className="mb-8 md:mb-24 text-xl px-2">
                  Step into the world of BOOKVERSE, where epic tales of manga, manhwa, and manhua await. Dive into thrilling adventures, mysteries, and heartwarming stories.
                </p>
                <div className="join">
                  <button className="btn join-item bg-green border-none hover:bg-gray-800 text-black rounded-lg" onClick={handleInstallClick}>
                    DOWNLOAD APP NOW !
                  </button>
                  <button
                    className="btn join-item border-green border-2 bg-base-100 tooltip tooltip-left before:w-[12rem] before:content-[attr(data-tip)] rounded-lg"
                    data-tip="Works only on certain browsers, e.g., Chrome."
                  >
                    <i className="bi bi-info-circle-fill text-green"></i>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        <div className="flex-grow">
          {children}
        </div>
        <footer className={`footer footer-center bg-base-100 text-base-content rounded p-6 mb-16`}>
          <nav>
            <div className="grid grid-flow-col gap-4">
              {socialLinks.map((social, index) => (
                <a key={index} className="btn bg-green btn-circle hover:bg-base-300 border-none hover:text-green text-black" href={social.href}>
                  <i className={`bi ${social.icon} text-xl`}></i>
                </a>
              ))}
            </div>
          </nav>
          <aside>
            <p>
              Copyright © {new Date().getFullYear()} - All rights reserved by <span className="text-green">ReiivanTheOnlyOne .</span>
            </p>
          </aside>
        </footer>
        {window.location.pathname !== '/dev/dashboard' && (
          <div className="btm-nav btm-nav-md bg-base-300 !z-50">
            <Link
              to="/library"
              className={isActive('/library') ? 'active text-green' : ''}
            >
              <i className={`bi bi-bookmark${isActive('/library') ? '-fill' : ''}`}></i>
              <span className="btm-nav-label">LIBRARY</span>
            </Link>
            <Link
              to="/"
              className={isActive('/') ? 'active text-green' : ''}
              onClick={(e) => {
                e.preventDefault();
                window.location.href = "/";
              }}
            >
              <i className={`bi bi-house-door${isActive('/') ? '-fill' : ''}`}></i>
              <span className="btm-nav-label">HOME</span>
            </Link>
            <Link
              to="/book/1"
              className={isActive('/book') ? 'active text-green' : ''}
            >
              <i className={`bi bi-book${isActive('/book') ? '-fill' : ''}`}></i>
              <span className="btm-nav-label">BOOK</span>
            </Link>
          </div>
        )}
      </div>
    </>
  );
};

export default Layout;