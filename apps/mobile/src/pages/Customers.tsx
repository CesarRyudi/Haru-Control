import { Customer } from "@haru-control/types";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import "./Customers.css";

export default function Customers() {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

  // Form states
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [observation, setObservation] = useState("");
  const [formLoading, setFormLoading] = useState(false);

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
      setName(customer.name);
      setPhone(customer.phone || "");
      setAddress(customer.address || "");
      setObservation(customer.observation || "");
    } else {
      setEditingCustomer(null);
      setName("");
      setPhone("");
      setAddress("");
      setObservation("");
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingCustomer(null);
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, "");
    if (value.length > 11) value = value.slice(0, 11);
    
    if (value.length > 2) {
      value = `(${value.slice(0, 2)}) ${value.slice(2)}`;
    }
    if (value.length > 9) {
      value = `${value.slice(0, 10)}-${value.slice(10)}`;
    }
    setPhone(value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setFormLoading(true);
    try {
      const payload = {
        name: name.trim(),
        phone: phone.trim() || undefined,
        address: address.trim() || undefined,
        observation: observation.trim() || undefined,
      };

      if (editingCustomer) {
        await api.patch(`/customers/${editingCustomer.id}`, payload);
      } else {
        await api.post("/customers", payload);
      }
      
      handleCloseModal();
      loadCustomers();
    } catch (error) {
      console.error("Erro ao salvar cliente:", error);
      alert("Ocorreu um erro ao salvar o cliente.");
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <div className="customers-page">
      <header className="customers-header">
        <button onClick={() => navigate("/")} className="btn-back">
          ← Voltar
        </button>
        <h1>Clientes</h1>
        <button onClick={() => handleOpenModal()} className="btn-add">
          + Novo Cliente
        </button>
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
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>{editingCustomer ? "Editar Cliente" : "Novo Cliente"}</h2>
            
            <form onSubmit={handleSubmit} className="customer-form">
              <div className="form-group">
                <label>Nome *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: João Silva"
                  required
                />
              </div>

              <div className="form-group">
                <label>Telefone</label>
                <input
                  type="text"
                  value={phone}
                  onChange={handlePhoneChange}
                  placeholder="Ex: (11) 99999-9999"
                  maxLength={15}
                />
              </div>

              <div className="form-group">
                <label>Endereço de Entrega Padrão</label>
                <textarea
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Rua, número, bairro..."
                  rows={2}
                />
              </div>

              <div className="form-group">
                <label>Observação (Opcional)</label>
                <textarea
                  value={observation}
                  onChange={(e) => setObservation(e.target.value)}
                  placeholder="Preferências, detalhes sobre o cliente..."
                  rows={2}
                />
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={handleCloseModal}
                  disabled={formLoading}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={formLoading || !name.trim()}
                >
                  {formLoading ? "Salvando..." : "Salvar Cliente"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
