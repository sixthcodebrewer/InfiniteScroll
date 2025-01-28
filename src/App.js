import './App.css';
import { useState, useEffect, useCallback } from 'react';
import { FixedSizeList as List } from 'react-window';
import { debounce } from 'lodash';

function App() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [hasMorePrev, setHasMorePrev] = useState(false);
  const [skip, setSkip] = useState(0);
  const ITEMS_PER_PAGE = 10;

  // Add these constants for virtualization
  const ITEM_HEIGHT = 50; // Height of each list item in pixels
  const WINDOW_HEIGHT = 400; // Height of the scrollable container

  const fetchProducts = useCallback(async (direction = 'next') => {
    if (loading || (direction === 'next' && !hasMore) || (direction === 'prev' && !hasMorePrev)) return;
    setLoading(true);

    const skipValue = direction === 'next' 
      ? skip + ITEMS_PER_PAGE 
      : Math.max(0, skip - ITEMS_PER_PAGE);

    try {
      const response = await fetch(
        `https://dummyjson.com/products?limit=${ITEMS_PER_PAGE}&skip=${skipValue}&select=title,price`
      );
      const { products: newProducts } = await response.json();
      
      if (!newProducts.length) {
        direction === 'next' ? setHasMore(false) : setHasMorePrev(false);
        return;
      }

      setProducts(prev => {
        if (direction === 'next') {
          return prev.slice(0, 20).concat(newProducts);
        }
        return newProducts.concat(prev.slice(10));
      });

      setSkip(skipValue);
      setHasMorePrev(skipValue > 0);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  }, [skip, loading, hasMore, hasMorePrev, ITEMS_PER_PAGE]);

  // Initial load
  useEffect(() => {
    fetch(`https://dummyjson.com/products?limit=${ITEMS_PER_PAGE * 3}&skip=0&select=title,price`)
      .then(res => res.json())
      .then(data => {
        setProducts(data.products);
        setSkip(ITEMS_PER_PAGE);
      })
      .catch(error => console.error('Error:', error));
  }, []);

  // Row renderer for react-window
  const Row = useCallback(({ index, style }) => {
    const product = products[index];
    return (
      <div 
        style={{
          ...style,
          display: 'flex',
          alignItems: 'center',
          padding: '0 20px',
          borderBottom: '1px solid #eee',
          backgroundColor: 'white'
        }}
      >
        {product.title} - ${product.price}
      </div>
    );
  }, [products]);

  //scroll handler for virtualized list
  const handleScroll = useCallback(
    debounce(({ scrollOffset, scrollDirection }) => {
      const isNearBottom = scrollOffset >= (products.length * ITEM_HEIGHT) - WINDOW_HEIGHT * 1.5;
      const isNearTop = scrollOffset <= WINDOW_HEIGHT * 0.2;

      if (scrollDirection === 'forward' && isNearBottom) fetchProducts('next');
      if (scrollDirection === 'backward' && isNearTop) fetchProducts('prev');
    }, 200),
    [products.length, fetchProducts]
  );

  return (
    <div className="App">
      <h1>Products List</h1>
      <div style={{ 
        height: WINDOW_HEIGHT, 
        border: '1px solid #ccc',
        margin: '0 auto',
        maxWidth: '800px' 
      }}>
        {loading && <div style={{ padding: '10px', textAlign: 'center' }}>Loading...</div>}
        
        <List
          height={WINDOW_HEIGHT}
          itemCount={products.length}
          itemSize={ITEM_HEIGHT}
          onScroll={handleScroll}
          width="100%"
          overscanCount={3}
        >
          {Row}
        </List>
      </div>

      {/* Debug Panel */}
      <div style={{ padding: '20px' }}>
        <h3>Debug Info:</h3>
        <table style={{ 
          margin: '0 auto', 
          borderCollapse: 'collapse', 
          width: '300px',
          textAlign: 'left'
        }}>
          <tbody>
            <tr>
              <td style={{ padding: '8px', borderBottom: '1px solid #ddd' }}>Skip:</td>
              <td style={{ padding: '8px', borderBottom: '1px solid #ddd' }}>{skip}</td>
            </tr>
            <tr>
              <td style={{ padding: '8px', borderBottom: '1px solid #ddd' }}>Has More:</td>
              <td style={{ padding: '8px', borderBottom: '1px solid #ddd' }}>{hasMore.toString()}</td>
            </tr>
            <tr>
              <td style={{ padding: '8px', borderBottom: '1px solid #ddd' }}>Products:</td>
              <td style={{ padding: '8px', borderBottom: '1px solid #ddd' }}>{products.length}</td>
            </tr>
          </tbody>
        </table>

      </div>
    </div>
  );
}

export default App;
