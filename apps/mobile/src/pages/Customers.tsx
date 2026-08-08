import { Customer } from "@haru-control/types";
import { FloatingActionButton } from "@haru-control/ui";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import CustomerFormModal from "../components/CustomerFormModal";
import "./Customers.css";

export default function Customers() {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);



  useEffect(() => {
    loadCustomers();
  }, [search]);

  const loadCustomers = async () => {
    setLoading(true);
    try {
      const response = await api.get("/customers", {
        params: { search: search || undefined },
      });
      setCustomers(response.data);
    } catch (error) {
      console.error("Erro ao carregar clientes:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (customer?: Customer) => {
    if (customer) {
      setEditingCustomer(customer);
    } else {
      setEditingCustomer(null);
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingCustomer(null);
  };



  return (
    <div className="customers-page">
      <header className="customers-header">
        <h1>Clientes</h1>
      </header>

      <div className="customers-search">
        <input
          type="text"
          placeholder="Buscar cliente por nome ou telefone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="search-input"
        />
      </div>

      <div className="customers-content">
        {loading ? (
          <div className="loading">Carregando...</div>
        ) : customers.length === 0 ? (
          <div className="empty-state">Nenhum cliente encontrado.</div>
        ) : (
          <div className="customers-grid">
            {customers.map((customer) => (
              <div key={customer.id} className="customer-card" onClick={() => handleOpenModal(customer)}>
                <div className="customer-info">
                  <h3>{customer.name}</h3>
                  {customer.phone && <p className="customer-detail">📞 {customer.phone}</p>}
                  {customer.address && <p className="customer-detail">📍 {customer.address}</p>}
                  {customer.observation && <p className="customer-detail">📝 {customer.observation}</p>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {isModalOpen && (
        <CustomerFormModal
          editingCustomer={editingCustomer}
          onClose={handleCloseModal}
          onSuccess={() => {
            handleCloseModal();
            loadCustomers();
          }}
          onDelete={() => {
            handleCloseModal();
            loadCustomers();
          }}
        />
      )}

      <FloatingActionButton
        onClick={() => handleOpenModal()}
        icon="＋"
      />
    </div>
  );
}
