import React, { useState, useEffect } from "react";
import { Customer } from "@haru-control/types";
import api from "../services/api";
import "../pages/Customers.css"; // Reuse modal styles

interface CustomerFormModalProps {
  editingCustomer?: Customer | null;
  onClose: () => void;
  onSuccess: (customer: Customer) => void;
  onDelete?: (customerId: string) => void;
}

export default function CustomerFormModal({ editingCustomer, onClose, onSuccess, onDelete }: CustomerFormModalProps) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [observation, setObservation] = useState("");
  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => {
    if (editingCustomer) {
      setName(editingCustomer.name);
      setPhone(editingCustomer.phone || "");
      setAddress(editingCustomer.address || "");
      setObservation(editingCustomer.observation || "");
    }
  }, [editingCustomer]);


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

      let response;
      if (editingCustomer) {
        response = await api.patch(`/customers/${editingCustomer.id}`, payload);
      } else {
        response = await api.post("/customers", payload);
      }
      
      onSuccess(response.data);
      onClose();
    } catch (error) {
      console.error("Erro ao salvar cliente:", error);
      alert("Ocorreu um erro ao salvar o cliente.");
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!editingCustomer) return;
    if (!confirm("Tem certeza que deseja excluir este cliente?")) return;
    
    setFormLoading(true);
    try {
      await api.delete(`/customers/${editingCustomer.id}`);
      if (onDelete) onDelete(editingCustomer.id);
      onClose();
    } catch (error) {
      console.error("Erro ao excluir cliente:", error);
      alert("Ocorreu um erro ao excluir o cliente.");
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
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
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Ex: (11) 99999-9999 ou +55 11 99999-9999"
            />
          </div>

          <div className="form-group">
            <label>Endereço de Entrega</label>
            <textarea
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Rua, Número, Bairro, Referência..."
              rows={3}
            />
          </div>

          <div className="form-group">
            <label>Observação (Opcional)</label>
            <textarea
              value={observation}
              onChange={(e) => setObservation(e.target.value)}
              placeholder="Alergias, preferências, etc..."
              rows={2}
            />
          </div>

          <div className="modal-actions">
            {editingCustomer && onDelete && (
              <button
                type="button"
                className="btn-danger"
                style={{ background: '#ff4757', color: 'white', border: 'none', padding: '16px', borderRadius: '8px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', flex: 1 }}
                onClick={handleDelete}
                disabled={formLoading}
              >
                Excluir
              </button>
            )}
            <button
              type="button"
              className="btn-secondary"
              onClick={onClose}
              disabled={formLoading}
              style={{ flex: 1 }}
            >
              Cancelar
            </button>
            <button type="submit" className="btn-primary" disabled={formLoading} style={{ flex: 1 }}>
              {formLoading ? "Salvando..." : "Salvar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
