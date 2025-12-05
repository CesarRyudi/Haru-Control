import { formatCurrency } from '@haru-control/utils';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../services/api';
import { useOrderDraft } from '../store/useOrderDraft';
import './OrderForm.css';

interface Product {
  id: string;
  name: string;
  unit: string;
  price: number;
}

export default function OrderForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;
  
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [warnings, setWarnings] = useState<string[]>([]);
  
  const { items, addItem, updateItem, removeItem, clear, getTotalPrice } = useOrderDraft();

  useEffect(() => {
    loadProducts();
    if (isEdit) {
      loadOrder();
    }
  }, [id]);

  const loadProducts = async () => {
    try {
      const response = await api.get('/products');
      setProducts(response.data);
    } catch (error) {
      console.error('Erro ao carregar produtos:', error);
    }
  };

  const loadOrder = async () => {
    try {
      const response = await api.get(`/orders/${id}`);
      const order = response.data;
      
      clear();
      order.items.forEach((item: any) => {
        addItem({
          productId: item.productId,
          productName: item.product.name,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
        });
      });
    } catch (error) {
      console.error('Erro ao carregar pedido:', error);
      alert('Erro ao carregar pedido');
      navigate('/');
    }
  };

  const handleAddProduct = (product: Product) => {
    addItem({
      productId: product.id,
      productName: product.name,
      quantity: 1,
      unitPrice: product.price,
    });
  };

  const handleSave = async () => {
    if (items.length === 0) {
      alert('Adicione ao menos um produto ao pedido');
      return;
    }

    setLoading(true);
    setWarnings([]);

    try {
      const payload = {
        items: items.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
        })),
      };

      let response;
      if (isEdit) {
        response = await api.patch(`/orders/${id}`, payload);
      } else {
        response = await api.post('/orders', payload);
      }

      if (response.data.warnings && response.data.warnings.length > 0) {
        setWarnings(response.data.warnings);
      } else {
        clear();
        navigate('/');
      }
    } catch (error: any) {
      console.error('Erro ao salvar pedido:', error);
      alert(error.response?.data?.message || 'Erro ao salvar pedido');
    } finally {
      setLoading(false);
    }
  };

  const handleContinueWithWarnings = () => {
    clear();
    navigate('/');
  };

  return (
    <div className="order-form">
      <header className="form-header">
        <button onClick={() => navigate('/')} className="btn-back">
          ← Voltar
        </button>
        <h1>{isEdit ? 'Editar Pedido' : 'Novo Pedido'}</h1>
      </header>

      <div className="form-content">
        <section className="products-section">
          <h2>Produtos Disponíveis</h2>
          <div className="products-grid">
            {products.map(product => (
              <div key={product.id} className="product-card">
                <div className="product-info">
                  <h3>{product.name}</h3>
                  <p className="product-unit">{product.unit}</p>
                  <p className="product-price">{formatCurrency(product.price)}</p>
                </div>
                <button
                  onClick={() => handleAddProduct(product)}
                  className="btn-add"
                >
                  +
                </button>
              </div>
            ))}
          </div>
        </section>

        <section className="cart-section">
          <h2>Itens do Pedido</h2>
          
          {items.length === 0 ? (
            <p className="empty-cart">Nenhum produto adicionado</p>
          ) : (
            <>
              <div className="cart-items">
                {items.map(item => (
                  <div key={item.productId} className="cart-item">
                    <div className="item-info">
                      <h3>{item.productName}</h3>
                      <p>{formatCurrency(item.unitPrice)}</p>
                    </div>
                    <div className="item-controls">
                      <button
                        onClick={() => updateItem(item.productId, Math.max(1, item.quantity - 1))}
                        className="btn-qty"
                      >
                        -
                      </button>
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => updateItem(item.productId, parseInt(e.target.value) || 1)}
                        className="qty-input"
                        min="1"
                      />
                      <button
                        onClick={() => updateItem(item.productId, item.quantity + 1)}
                        className="btn-qty"
                      >
                        +
                      </button>
                      <button
                        onClick={() => removeItem(item.productId)}
                        className="btn-remove"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="cart-total">
                <span>Total:</span>
                <strong>{formatCurrency(getTotalPrice())}</strong>
              </div>

              {warnings.length > 0 && (
                <div className="warnings">
                  <h3>⚠️ Avisos</h3>
                  {warnings.map((warning, index) => (
                    <p key={index} className="warning-message">{warning}</p>
                  ))}
                  <div className="warning-actions">
                    <button onClick={() => setWarnings([])} className="btn-secondary">
                      Corrigir
                    </button>
                    <button onClick={handleContinueWithWarnings} className="btn-primary">
                      Continuar Mesmo Assim
                    </button>
                  </div>
                </div>
              )}

              <button
                onClick={handleSave}
                disabled={loading}
                className="btn-save"
              >
                {loading ? 'Salvando...' : isEdit ? 'Atualizar Pedido' : 'Criar Pedido'}
              </button>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
