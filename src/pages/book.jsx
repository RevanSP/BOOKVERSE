/* eslint-disable no-unused-vars */
import Layout from "../layout/Layout";
import useAOS from "../utils/AOS";
import { useQuery } from "@tanstack/react-query";
import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { Fancybox } from "@fancyapps/ui";
import "@fancyapps/ui/dist/fancybox/fancybox.css";

const fetchMangaData = async () => {
  const collections = ['manga', 'manhua', 'manhwa'];
  const data = await Promise.all(collections.map((name) => fetch(`/data/${name}.json`).then((res) => res.json())));

  const fetchImageWithFallback = async (imageUrl) => {
    const proxyUrls = [
      `https://proxy-cloudflare-server.revanspstudy28.workers.dev/api/proxy?url=${encodeURIComponent(imageUrl)}`,
      `https://api.allorigins.win/raw?url=${encodeURIComponent(imageUrl)}`
    ];

    let attempts = 0;
    const maxAttempts = 2;

    while (attempts < maxAttempts) {
      try {
        const response = await fetch(proxyUrls[attempts]);
        if (!response.ok) throw new Error('Failed to fetch image');

        return proxyUrls[attempts];
      } catch (error) {
        attempts++;
        if (attempts >= maxAttempts) throw new Error('Both proxies failed');
      }
    }
  };

  data.forEach((mangaList) => {
    mangaList.forEach(async (manga) => {
      try {
        const proxyImageUrl = await fetchImageWithFallback(manga.imageUrl);
        manga.imageUrl = proxyImageUrl;
      } catch (error) {
        console.error('Error fetching image:', error);
      }
    });
  });

  return data.flat().sort((a, b) => parseFloat(a.number) - parseFloat(b.number) || a.title.localeCompare(b.title));
};

function BookPage() {
  useAOS();
  const { page = 1 } = useParams();
  const navigate = useNavigate();

  const [savedManga, setSavedManga] = useState([]);
  const isMangaSaved = (mangaTitle) => savedManga.includes(mangaTitle);

  useEffect(() => {
    setSavedManga(JSON.parse(localStorage.getItem('savedManga')) || []);
  }, []);

  const handleBookmarkClick = (mangaTitle) => {
    const updatedSavedManga = savedManga.includes(mangaTitle)
      ? savedManga.filter(title => title !== mangaTitle)
      : [...savedManga, mangaTitle];

    setSavedManga(updatedSavedManga);
    localStorage.setItem('savedManga', JSON.stringify(updatedSavedManga));
  };

  const [itemsPerPage, setItemsPerPage] = useState(window.innerWidth < 768 ? 12 : 24);
  const [pagesPerGroup, setPagesPerGroup] = useState(window.innerWidth < 768 ? 5 : 15);
  const [selectedLetter, setSelectedLetter] = useState('');
  const [ratingSort, setRatingSort] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const { data: mangaData, isLoading, isError } = useQuery({
    queryKey: ['mangaData'],
    queryFn: fetchMangaData,
    staleTime: Infinity,
    cacheTime: 24 * 60 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const [savedChapters, setSavedChapters] = useState([]);
  const [selectedManga, setSelectedManga] = useState(null);
  const mangaModalRef = useRef(null);

  useEffect(() => {
    setSavedChapters(JSON.parse(localStorage.getItem('savedChapters')) || []);
  }, []);


  const [chapterImages, setChapterImages] = useState([]);

  const imageCache = new Map();

  const fetchImageWithRetry = async (imgSrc, retries = 2, delay = 500) => {
    if (imageCache.has(imgSrc)) {
      return imageCache.get(imgSrc);
    }

    const fetchWithProxy = async (url) => {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Image fetch failed');
      }
      return await response.blob();
    };

    const proxyUrls = [
      `https://proxy-cloudflare-server.revanspstudy28.workers.dev/api/proxy?url=${encodeURIComponent(imgSrc)}`,
      `https://api.allorigins.win/raw?url=${encodeURIComponent(imgSrc)}`
    ];

    let currentProxyIndex = 0;
    let attempts = 0;

    while (attempts < 2 * retries) {
      try {
        const imageBlob = await fetchWithProxy(proxyUrls[currentProxyIndex]);
        imageCache.set(imgSrc, imageBlob);
        return imageBlob;
      } catch (error) {
        currentProxyIndex = (currentProxyIndex + 1) % 2;
        attempts++;
        if (attempts >= 2 * retries) {
          throw new Error('Both proxies failed after retries');
        }
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  };

  const fetchChapterImagesWithRetry = async (chapter) => {
    const images = [];

    for (let i = 0; i < chapter.images.length; i++) {
      try {
        const imageBlob = await fetchImageWithRetry(chapter.images[i]);
        images.push({
          src: URL.createObjectURL(imageBlob),
          type: 'image',
          caption: `Chapter ${chapter.number} - Image ${i + 1}`,
        });
      } catch (error) {
        console.error('Failed to fetch image', error);
      }
    }

    return images;
  };

  const [loadingChapter, setLoadingChapter] = useState(null);

  const handleChapterClick = async (chapter) => {
    setLoadingChapter(chapter.number);

    const images = await fetchChapterImagesWithRetry(chapter);
    setChapterImages(images);
    Fancybox.show(images);

    const newChapter = {
      number: chapter.number,
      title: selectedManga.title,
      status: 'read',
    };

    const updatedChapters = savedChapters.filter(
      (ch) => ch.title !== selectedManga.title
    ).concat(newChapter);

    setSavedChapters(updatedChapters);
    localStorage.setItem('savedChapters', JSON.stringify(updatedChapters));

    mangaModalRef.current?.close();

    setLoadingChapter(null);
  };

  const handleMangaClick = (manga) => {
    setSelectedManga(manga);
    document.getElementById('manga').showModal();
  };

  useEffect(() => {
    const handleResize = () => {
      setItemsPerPage(window.innerWidth < 768 ? 12 : 24);
      setPagesPerGroup(window.innerWidth < 768 ? 5 : 15);
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (isLoading) return <Layout><div className="flex justify-center items-center min-h-screen"><span className="loading loading-spinner loading-lg text-green"></span></div></Layout>;
  if (isError) return <Layout><div className="flex justify-center items-center min-h-screen">Error loading manga data</div></Layout>;

  const currentPage = parseInt(page, 10);
  const filteredMangaData = mangaData.filter(manga =>
    (!selectedLetter || manga.title[0].toUpperCase() === selectedLetter) &&
    (!selectedType || manga.type === selectedType) &&
    (!selectedGenre || manga.info.genres.includes(selectedGenre)) &&
    (searchQuery ? manga.title.toLowerCase().includes(searchQuery.toLowerCase()) : true)
  );

  const sortedMangaData = filteredMangaData.sort((a, b) => {
    if (ratingSort === 'highToLow') return parseFloat(b.rating) - parseFloat(a.rating);
    if (ratingSort === 'lowToHigh') return parseFloat(a.rating) - parseFloat(b.rating);
    return 0;
  });

  const totalPages = Math.ceil(sortedMangaData.length / itemsPerPage);
  const currentGroupStart = Math.floor((currentPage - 1) / pagesPerGroup) * pagesPerGroup + 1;
  const currentGroupEnd = Math.min(currentGroupStart + pagesPerGroup - 1, totalPages);

  const currentItems = sortedMangaData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handlePageChange = (pageNumber) => {
    if (pageNumber !== currentPage) navigate(`/book/${pageNumber}`);
  };

  const handlePageGroupChange = (direction) => {
    const newPage = currentGroupStart + (direction === 'prev' ? -pagesPerGroup : pagesPerGroup);
    navigate(`/book/${Math.max(1, Math.min(newPage, totalPages - pagesPerGroup + 1))}`);
  };

  const resetFilter = () => {
    setSelectedLetter('');
    setRatingSort('');
    setSelectedType('');
    setSelectedGenre('');
    setSearchQuery('');
    navigate('/book/1');
  };

  const allGenres = [...new Set(mangaData.flatMap(manga => manga.info.genres))];

  const handleInputFocus = () => {
    navigate('/book/1');
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  return <Layout>
    <dialog id="manga" className="modal" ref={mangaModalRef}>
      <div className="modal-box border-green border-2 rounded-lg w-11/12 max-w-7xl p-4">
        <form method="dialog">
          <button className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2 text-green">✕</button>
        </form>
        {selectedManga && (
          <>
            <h3 className="font-bold text-lg mb-4 text-green">{selectedManga.type}</h3>
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1 bg-base-300 p-3 rounded-lg flex">
                <img
                  src={selectedManga.imageUrl}
                  alt={selectedManga.title}
                  className="object-cover object-center h-40 lg:h-64 rounded-lg mr-4"
                />
                <div className="flex flex-col text-xs overflow-y-auto h-40 lg:h-64">
                  <div className="text-xs"><strong>TITLE :</strong> {selectedManga.title}</div>
                  <div className="text-xs"><strong>RATING :</strong> {selectedManga.rating}</div>
                  <div className="text-xs"><strong>AUTHOR:</strong> {selectedManga.info.author}</div>
                  <div className="text-xs"><strong>ILLUSTRATOR:</strong> {selectedManga.info.illustrator}</div>
                  <div className="text-xs"><strong>ALTERNATIVE TITLES :</strong></div>
                  <ul className="list-disc ml-4">
                    {selectedManga.info.alternativeTitles.map((title, index) => (
                      <li className="text-xs" key={index}>{title}</li>
                    ))}
                  </ul>
                  <div className="text-xs"><strong>GENRES : </strong>{selectedManga.info.genres.map((genre, index) => (
                    <div key={index} className="badge bg-green text-black text-xs mr-1 mt-1 uppercase rounded-lg px-1.5">{genre}</div>
                  ))}</div>
                </div>
              </div>
              <div className="flex-1 bg-base-300 p-4 rounded-lg">
                <h4 className="text-lg font-semibold text-green mb-3">CHAPTERS</h4>
                <div
                  className={`grid grid-cols-3 md:grid-cols-3 lg:grid-cols-5 gap-2.5 overflow-y-auto 
  ${selectedManga.chapters.length > 15 ? 'h-96 lg:h-56' : 'h-auto'}`}
                >
                  {selectedManga.chapters.map((chapter, index) => {
                    const isChapterSelected = savedChapters.some(
                      (ch) => ch.number === chapter.number && ch.title === selectedManga.title
                    );

                    return (
                      <button
                        key={index}
                        className={`btn btn-sm border-2 rounded-lg text-xs border-green ${isChapterSelected ? 'bg-green text-black' : 'bg-base-100'}`}
                        onClick={() => handleChapterClick(chapter)}
                      >
                        {loadingChapter === chapter.number ? (
                          <span className="loading loading-spinner loading-xs"></span>
                        ) : (
                          `CH. ${chapter.number}`
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </dialog>
    <section className="py-6 md:py-8 mt-14">
      <div className="mx-auto px-4">
        <div className="mb-3 lg:px-3">
          <div className="flex items-center gap-2">
            <label className="input input-bordered flex items-center gap-2 border-2 border-green bg-base-100 flex-grow">
              <input
                type="text"
                className="grow text-xs"
                placeholder="Search Manga, Manhua, and Manhwa ..."
                value={searchQuery}
                onFocus={handleInputFocus}
                onChange={handleSearchChange}
              />
              <i className="bi bi-search"></i>
            </label>
            <button onClick={() => document.getElementById('notes').showModal()}
              className="btn btn-square bg-green hover:bg-base-300 text-black border-2 border-green hover:text-green"
            >
              <i className="bi bi-exclamation-triangle-fill"></i>
            </button>
          </div>
          <div className="flex flex-col lg:flex-row gap-2 mt-2">
            <div className="flex gap-2 lg:flex-row lg:w-auto sm:w-full">
              <select
                className="select select-bordered border-2 text-xs border-green bg-base-100 w-full"
                value={ratingSort}
                onChange={(e) => setRatingSort(e.target.value)}
              >
                <option value="">RATING</option>
                <option value="highToLow">HIGHEST TO LOWEST</option>
                <option value="lowToHigh">LOWEST TO HIGHEST</option>
              </select>
              <select
                className="select select-bordered border-2 text-xs border-green bg-base-100"
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
              >
                <option value="">TYPE</option>
                {['MANGA', 'MANHUA', 'MANHWA'].map((type) => {
                  const typeCount = mangaData.filter(manga => manga.type === type).length;

                  return (
                    <option key={type} value={type}>
                      {type} ({typeCount})
                    </option>
                  );
                })}
              </select>
            </div>
            <div className="lg:w-full sm:w-full">
              <select
                className="select select-bordered border-2 border-green bg-base-100 text-xs w-full"
                value={selectedGenre}
                onChange={(e) => setSelectedGenre(e.target.value)}
              >
                <option value="">GENRE</option>
                {allGenres
                  .sort()
                  .map((genre, index) => {
                    const genreCount = mangaData.filter(manga => manga.info.genres.includes(genre)).length;

                    return (
                      <option key={index} value={genre}>
                        {genre} ({genreCount})
                      </option>
                    );
                  })}
              </select>
            </div>
          </div>
        </div>
        <div className="lg:px-3 mb-6">
          <div className="card w-full bg-base-100 border-2 border-green">
            <div className="card-body p-4">
              <div className="overflow-x-auto">
                <div className="flex space-x-1 lg:space-x-3 lg:justify-start">
                  <button
                    className="btn btn-square bg-green hover:bg-base-300 btn-sm hover:text-green text-black"
                    onClick={resetFilter}
                  >
                    <i className="bi bi-arrow-clockwise"></i>
                  </button>
                  <div className="flex space-x-1 lg:space-x-3 ml-auto">
                    {Array.from({ length: 26 }, (_, i) => {
                      const letter = String.fromCharCode(65 + i);
                      return (
                        <button
                          key={i}
                          className={`btn btn-square btn-sm ${selectedLetter === letter ? 'bg-green' : 'text-black'} bg-green hover:bg-base-300 hover:text-green`}
                          onClick={() => setSelectedLetter(letter)}
                        >
                          {letter}
                        </button>
                      );
                    })}
                  </div>
                  <div className="flex space-x-1 lg:space-x-3 ml-auto">
                    {Array.from({ length: 10 }, (_, i) => {
                      const number = String(i);
                      return (
                        <button
                          key={i + 26}
                          className={`btn btn-square btn-sm ${selectedLetter === number ? 'bg-green' : 'text-black'} bg-green hover:bg-base-300 hover:text-green`}
                          onClick={() => setSelectedLetter(number)}
                        >
                          {number}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="mx-auto sm:px-3 lg:px-3">
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-8 xl:grid-cols-12 2xl:grid-cols-8">
            {currentItems.map((manga, index) => {
              const normalizedRating = parseFloat(manga.rating) || 0;
              const fullStars = Math.floor(normalizedRating / 2);
              const halfStar = normalizedRating % 2 >= 1 ? 1 : 0;
              const emptyStars = 5 - fullStars - halfStar;

              const typeImage =
                manga.type === "MANGA"
                  ? "https://flagicons.lipis.dev/flags/4x3/jp.svg"
                  : manga.type === "MANHUA"
                    ? "https://flagicons.lipis.dev/flags/4x3/cn.svg"
                    : manga.type === "MANHWA"
                      ? "https://flagicons.lipis.dev/flags/4x3/kr.svg"
                      : "";

              return (
                <div key={index} className="flex flex-col bg-base-200 relative border-2 border-green rounded-sm overflow-hidden" data-aos="fade-up"
                  data-aos-delay={index * 50}
                  data-aos-duration="1000">
                  <div className="relative group">
                    <img
                      src={manga.imageUrl}
                      alt={manga.title}
                      className="object-cover object-center h-48 md:h-64 rounded-none transition-transform duration-300 ease-in-out transform group-hover:scale-150 group-hover:rotate-3 scale-110 md:scale-125"
                      loading="lazy"
                      onClick={() => handleMangaClick(manga)}
                    />
                    <button
                      className="btn bg-green hover:bg-base-300 btn-square btn-xs absolute top-2 right-2 z-10 rounded-sm hover:text-green text-black border-none"
                      onClick={() => handleBookmarkClick(manga.title)}
                    >
                      <i
                        className={`bi ${isMangaSaved(manga.title) ? 'bi-bookmark-fill' : 'bi-bookmark'}`}
                      ></i>
                    </button>
                    {typeImage && (
                      <img
                        src={typeImage}
                        alt={`${manga.type} flag`}
                        className="absolute top-2 left-2 w-6 h-6" loading="lazy"
                      />
                    )}
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 bg-black/60 py-3 px-2 z-10">
                    <h3 className="text-xs font-medium text-white truncate">{manga.title}</h3>
                    <div className="flex flex-col justify-between h-full">
                      <div className="mt-1 -mb-1 rounded flex items-center space-x-1">
                        {[...Array(fullStars)].map((_, i) => (
                          <i key={`full-${i}`} className="bi bi-star-fill text-green text-xs" />
                        ))}
                        {halfStar === 1 && (
                          <i key="half" className="bi bi-star-half text-green text-xs" />
                        )}
                        {[...Array(emptyStars)].map((_, i) => (
                          <i key={`empty-${i}`} className="bi bi-star text-green text-xs" />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          {currentItems.length === 0 && (
            <div role="alert" className="alert border-2 border-green bg-base-100 text-green" data-aos="fade-up">
              <i className="bi bi-info-circle"></i>
              <span>NOT FOUND</span>
            </div>
          )}
        </div>
        {currentItems.length > 0 && (
          <div className="flex space-x-2 lg:px-8 mt-6 justify-center">
            <button
              className="join-item btn btn-sm btn-square text-green bg-base-300"
              onClick={() => handlePageGroupChange("prev")}
              disabled={currentGroupStart === 1}
            >
              <i className="bi bi-chevron-double-left"></i>
            </button>
            <button
              className="join-item btn btn-sm btn-square text-green bg-base-300"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <i className="bi bi-chevron-left"></i>
            </button>
            {Array.from({ length: currentGroupEnd - currentGroupStart + 1 }, (_, i) => (
              <button
                key={i}
                className={`join-item btn btn-sm btn-square text-green ${currentPage === currentGroupStart + i ? "btn-active" : "bg-base-100"}`}
                onClick={() => handlePageChange(currentGroupStart + i)}
              >
                {currentGroupStart + i}
              </button>
            ))}
            <button
              className="join-item btn btn-sm btn-square text-green bg-base-300"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              <i className="bi bi-chevron-right"></i>
            </button>
            <button
              className="join-item btn btn-sm btn-square text-green bg-base-300"
              onClick={() => handlePageGroupChange("next")}
              disabled={currentGroupEnd === totalPages}
            >
              <i className="bi bi-chevron-double-right"></i>
            </button>
          </div>
        )}
      </div>
    </section>
  </Layout>;
}

export default BookPage;