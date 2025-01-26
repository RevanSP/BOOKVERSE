import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import IndexPage from './pages/index';
import LibraryPage from './pages/library';
import BookPage from './pages/book';

function App() {
  return (
    <Router basename="/">
      <Routes>
        <Route path="/" element={<IndexPage />} />
        <Route path="/library" element={<LibraryPage />} />
        <Route path="/book/:page" element={<BookPage />} />
      </Routes>
    </Router>
  );
}

export default App;