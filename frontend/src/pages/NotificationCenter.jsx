import React, { useState, useEffect } from 'react';
import { api, useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { t } from '../utils/translations';
import { 
  Search, 
  RotateCw, 
  Send, 
  MessageSquare, 
  Bell, 
  CheckCircle, 
  XCircle, 
  Mail, 
  Phone,
  FileText,
  Clock,
  Sparkles,
  Users
} from 'lucide-react';

export const NotificationCenter = () => {
  const { user, language } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [farmers, setFarmers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Broadcast Form
  const [selectedChannel, setSelectedChannel] = useState('WHATSAPP');
  const [selectedVillage, setSelectedVillage] = useState('ALL');
  const [selectedFarmerIds, setSelectedFarmerIds] = useState([]);
  const [messageText, setMessageText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [historySearch, setHistorySearch] = useState('');
  const [groupMode, setGroupMode] = useState('CHRONOLOGICAL'); // 'CHRONOLOGICAL', 'CHANNEL', 'TYPE'
  const [commMode, setCommMode] = useState('UNIVERSAL'); // 'UNIVERSAL', 'PERSONAL_WHATSAPP'
  const [personalWhatsAppQueue, setPersonalWhatsAppQueue] = useState([]);
  const [showQueueModal, setShowQueueModal] = useState(false);
  const [queueSentMap, setQueueSentMap] = useState({});

  const fetchNotificationLogs = async () => {
    setLoading(true);
    setError('');
    try {
      const [notifRes, farmersRes] = await Promise.all([
        api.get('/api/v1/notifications'),
        api.get('/api/v1/farmers')
      ]);
      setNotifications(notifRes.data);
      setFarmers(farmersRes.data);
    } catch (err) {
      setError('Failed to fetch communications feed.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotificationLogs();
  }, []);

  const resolveUIPlaceholders = (text, farmerIdList) => {
    let result = text;
    const dealerName = user?.businessName || user?.displayName || 'Our Store';
    result = result.replace(/\{\{\s*dealer\s*name\s*\}\}/gi, dealerName);
    result = result.replace(/\{\{\s*delear\s*name\s*\}\}/gi, dealerName);
    result = result.replace(/\{\{\s*dealername\s*\}\}/gi, dealerName);
    
    if (farmerIdList.length === 1) {
      const targetFarmer = farmers.find(f => f.id === farmerIdList[0]);
      if (targetFarmer) {
        const fName = `${targetFarmer.firstName} ${targetFarmer.lastName}`;
        result = result.replace(/\{\{\s*farmer\s*name\s*\}\}/gi, fName);
        result = result.replace(/\{\{\s*farmername\s*\}\}/gi, fName);
        const amtStr = (targetFarmer.outstandingCredit || 0).toLocaleString('en-IN');
        result = result.replace(/\{\{\s*amount\s*\}\}/gi, amtStr);
      }
    }
    return result;
  };

  const handleFarmerCheckboxChange = (id) => {
    let newIds = [];
    if (selectedFarmerIds.includes(id)) {
      newIds = selectedFarmerIds.filter(fId => fId !== id);
    } else {
      newIds = [...selectedFarmerIds, id];
    }
    setSelectedFarmerIds(newIds);
    
    // Auto-resolve dynamic placeholders in textbox if text has placeholder keys
    if (messageText.includes('{{') || messageText.includes('}}')) {
      setMessageText(resolveUIPlaceholders(messageText, newIds));
    }
  };

  const handleSelectAllFiltered = (filteredList) => {
    const filteredIds = filteredList.map(f => f.id);
    const allSelected = filteredIds.every(id => selectedFarmerIds.includes(id));
    if (allSelected) {
      // Unselect all in this filter
      setSelectedFarmerIds(selectedFarmerIds.filter(id => !filteredIds.includes(id)));
    } else {
      // Add all missing
      const newSelections = [...selectedFarmerIds];
      filteredIds.forEach(id => {
        if (!newSelections.includes(id)) newSelections.push(id);
      });
      setSelectedFarmerIds(newSelections);
    }
  };

  const handleApplyTemplate = (type) => {
    let templateText = '';
    if (language === 'Marathi') {
      switch (type) {
        case 'offer':
          templateText = 'प्रिय {{FarmerName}},\nSoftEdgex AgriSuite विशेष मान्सून ऑफर: सर्व प्रीमियम रासायनिक खते आणि बियाणांवर १०% सूट मिळवा. लाभ घेण्यासाठी शुक्रवारपूर्वी आमच्या दुकानाला भेट द्या!\nआदरपूर्वक,\n{{DealerName}}';
          break;
        case 'credit_due':
          templateText = 'प्रिय {{FarmerName}},\nहे एक नम्र स्मरणपत्र आहे की आपल्याकडे आमच्या दुकानात ₹{{Amount}} ची थकीत उधार रक्कम शिल्लक आहे. कृपया आपल्या सोयीनुसार लवकरात लवकर भरणा करावा.\nआपला/आपली नम्र,\n{{DealerName}}';
          break;
        case 'shop_notice':
          templateText = 'प्रिय {{FarmerName}},\nकृपया नोंद घ्यावी की स्थानिक सणामुळे उद्या आमचे दुकान बंद राहील. नेहमीच्या वेळा बुधवारपासून पूर्ववत सुरू होतील.\nआपला/आपली नम्र,\n{{DealerName}}';
          break;
        default:
          break;
      }
    } else if (language === 'Hindi') {
      switch (type) {
        case 'offer':
          templateText = 'प्रिय {{FarmerName}},\nSoftEdgex AgriSuite विशेष मानसून ऑफर: सभी प्रीमियम रासायनिक उर्वरकों और बीजों पर 10% की छूट पाएं। लाभ उठाने के लिए शुक्रवार से पहले हमारे स्टोर पर आएं!\nसादर,\n{{DealerName}}';
          break;
        case 'credit_due':
          templateText = 'प्रिय {{FarmerName}},\nयह एक विनम्र अनुस्मारक है कि आपके पास हमारी दुकान पर ₹{{Amount}} की बकाया उधार राशि है। कृपया अपनी सुविधानुसार जल्द से जल्द भुगतान करें।\nसादर,\n{{DealerName}}';
          break;
        case 'shop_notice':
          templateText = 'प्रिय {{FarmerName}},\nकृपया ध्यान दें कि स्थानीय त्योहार के अवसर पर कल हमारी दुकान बंद रहेगी। सामान्य समय बुधवार से फिर से शुरू होगा।\nसादर,\n{{DealerName}}';
          break;
        default:
          break;
      }
    } else {
      switch (type) {
        case 'offer':
          templateText = 'Dear {{FarmerName}},\nSoftEdgex AgriSuite Special Monsoon Offer: Get 10% discount on all premium chemical fertilizers and seeds. Visit our store before Friday to redeem!\nRegards,\n{{DealerName}}';
          break;
        case 'credit_due':
          templateText = 'Dear {{FarmerName}},\nThis is a friendly reminder that you have an outstanding credit balance of ₹{{Amount}} due at our shop. Please settle at your earliest convenience.\nRegards,\n{{DealerName}}';
          break;
        case 'shop_notice':
          templateText = 'Dear {{FarmerName}},\nPlease note that our store will be closed tomorrow on the occasion of the local festival. Normal hours resume Wednesday.\nRegards,\n{{DealerName}}';
          break;
        default:
          break;
      }
    }
    setMessageText(resolveUIPlaceholders(templateText, selectedFarmerIds));
  };

  const handleSendBroadcast = async (e) => {
    e.preventDefault();
    if (selectedFarmerIds.length === 0) {
      alert('Please select at least one recipient farmer.');
      return;
    }
    if (!messageText.trim()) {
      alert('Please compose your notification message.');
      return;
    }

    if (commMode === 'PERSONAL_WHATSAPP' || commMode === 'PERSONAL_SMS') {
      const selectedFarmersList = farmers.filter(f => selectedFarmerIds.includes(f.id));
      
      if (selectedFarmersList.length === 1) {
        const f = selectedFarmersList[0];
        const resolvedText = resolveUIPlaceholders(messageText, [f.id]);
        
        if (commMode === 'PERSONAL_WHATSAPP') {
          const cleanPhone = f.mobile.replace(/[^0-9]/g, '');
          const formattedPhone = cleanPhone.length === 10 ? '91' + cleanPhone : cleanPhone;
          window.open(`https://api.whatsapp.com/send?phone=${formattedPhone}&text=${encodeURIComponent(resolvedText)}`, '_blank');
        } else {
          window.open(`sms:${f.mobile}?body=${encodeURIComponent(resolvedText)}`, '_blank');
        }
        
        // Log to database as sent via personal channel
        try {
          const payload = {
            recipientName: `${f.firstName} ${f.lastName}`,
            channel: commMode === 'PERSONAL_WHATSAPP' ? 'WHATSAPP' : 'SMS',
            message: resolvedText,
            status: 'SENT'
          };
          await api.post('/api/v1/notifications', payload);
          setMessageText('');
          setSelectedFarmerIds([]);
          fetchNotificationLogs();
        } catch (err) {
          console.error(err);
        }
      } else {
        setPersonalWhatsAppQueue(selectedFarmersList);
        setShowQueueModal(true);
      }
      return;
    }

    try {
      const payload = {
        farmerIds: selectedFarmerIds,
        channel: selectedChannel,
        message: messageText
      };
      
      await api.post('/api/v1/notifications/broadcast', payload);
      alert(`Broadcast logged successfully! Universal ${selectedChannel} queue dispatched to ${selectedFarmerIds.length} farmers.`);
      
      setMessageText('');
      setSelectedFarmerIds([]);
      fetchNotificationLogs();
    } catch (err) {
      alert(err.response?.data?.message || 'Error executing broadcast.');
    }
  };

  // Filter farmers based on village & search query
  const filteredFarmers = farmers.filter(f => {
    const matchesVillage = selectedVillage === 'ALL' || f.village === selectedVillage;
    const fullName = `${f.firstName} ${f.lastName}`.toLowerCase();
    const matchesQuery = fullName.includes(searchQuery.toLowerCase()) || 
                         f.farmerCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         f.mobile.includes(searchQuery);
    return matchesVillage && matchesQuery;
  });

  // Extract unique villages
  const villages = Array.from(new Set(farmers.map(f => f.village).filter(Boolean)));

  // Filter notification history logs
  const filteredHistory = notifications.filter(n => 
    n.recipientName.toLowerCase().includes(historySearch.toLowerCase()) ||
    n.message.toLowerCase().includes(historySearch.toLowerCase()) ||
    n.channel.toLowerCase().includes(historySearch.toLowerCase())
  );

  const getChannelIcon = (channel) => {
    switch (channel?.toUpperCase()) {
      case 'WHATSAPP':
        return <MessageSquare size={14} style={{ color: '#22c55e' }} />;
      case 'SMS':
        return <Phone size={14} style={{ color: '#fbbf24' }} />;
      case 'EMAIL':
        return <Mail size={14} style={{ color: '#3b82f6' }} />;
      default:
        return <Bell size={14} style={{ color: '#a3a3a3' }} />;
    }
  };

  const getGroupedLogs = () => {
    const filtered = filteredHistory;
    if (groupMode === 'CHRONOLOGICAL') {
      return [{ title: 'All Dispatches', logs: filtered }];
    }
    if (groupMode === 'CHANNEL') {
      const whatsapp = filtered.filter(n => n.channel === 'WHATSAPP');
      const sms = filtered.filter(n => n.channel === 'SMS');
      const email = filtered.filter(n => n.channel === 'EMAIL');
      return [
        { title: 'WhatsApp Outbox', logs: whatsapp },
        { title: 'SMS Outbox', logs: sms },
        { title: 'Email PDF Campaigns', logs: email }
      ].filter(g => g.logs.length > 0);
    }
    if (groupMode === 'TYPE') {
      const promo = filtered.filter(n => n.message.toLowerCase().includes('offer') || n.message.toLowerCase().includes('discount'));
      const dues = filtered.filter(n => n.message.toLowerCase().includes('due') || n.message.toLowerCase().includes('outstanding') || n.message.toLowerCase().includes('settle') || n.message.toLowerCase().includes('reminder'));
      const general = filtered.filter(n => !promo.includes(n) && !dues.includes(n));
      return [
        { title: 'Marketing & Offers', logs: promo },
        { title: 'Outstanding Credit Reminders', logs: dues },
        { title: 'General Store Bulletins', logs: general }
      ].filter(g => g.logs.length > 0);
    }
    return [];
  };

  if (loading) {
    return <div style={{ padding: '2rem', color: 'var(--text-secondary)' }}>Loading notification manager...</div>;
  }

  const groupedLogs = getGroupedLogs();

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800 }}>{t('notificationCenterTitle', language)}</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>{t('notificationCenterSub', language)}</p>
        </div>
        <div>
          <button onClick={fetchNotificationLogs} className="btn btn-secondary">
            <RotateCw size={16} />
            <span>{t('refreshLogs', language)}</span>
          </button>
        </div>
      </div>

      {error && (
        <div style={{ padding: '1rem', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--error)', borderRadius: 'var(--radius-md)', marginBottom: '2rem' }}>
          {error}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '2rem' }}>
        
        {/* Left Side: Broadcast Creator */}
        <div className="glass-panel" style={{ padding: '2rem' }}>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Sparkles size={20} style={{ color: 'var(--accent-secondary)' }} />
            <span>{t('composeAlert', language)}</span>
          </h2>

          <form onSubmit={handleSendBroadcast}>
            <div className="form-group">
              <label className="form-label">{t('deliveryChannel', language)} *</label>
              <select className="input-field" value={selectedChannel} onChange={(e) => setSelectedChannel(e.target.value)} style={{ background: '#121b16' }}>
                <option value="WHATSAPP">{t('whatsappMessage', language)}</option>
                <option value="SMS">{t('smsAlert', language)}</option>
                <option value="EMAIL">{t('emailPdf', language)}</option>
              </select>
            </div>

            {/* Quick Templates */}
            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>{t('quickTemplates', language)}</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{t('variablesAutoReplace', language)}</span>
              </label>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <button type="button" onClick={() => handleApplyTemplate('offer')} className="btn btn-secondary" style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem' }}>
                  {t('monsoonPromotion', language)}
                </button>
                <button type="button" onClick={() => handleApplyTemplate('credit_due')} className="btn btn-secondary" style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem' }}>
                  {t('udharReminder', language)}
                </button>
                <button type="button" onClick={() => handleApplyTemplate('shop_notice')} className="btn btn-secondary" style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem' }}>
                  {t('shopClosedNotice', language)}
                </button>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">{t('messageContent', language)} *</label>
              <textarea 
                required
                className="input-field"
                style={{ minHeight: '140px', resize: 'vertical' }}
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                placeholder={t('typeMessagePlaceholder', language)}
              />
            </div>

            {/* Recipient Selection */}
            <div className="form-group">
              <label className="form-label">{t('selectRecipientFarmers', language)} *</label>
              
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
                <select 
                  className="input-field" 
                  value={selectedVillage} 
                  onChange={(e) => setSelectedVillage(e.target.value)} 
                  style={{ background: '#121b16', flex: 1 }}
                >
                  <option value="ALL">Filter by Village: ALL</option>
                  {villages.map(v => (
                    <option key={v} value={v}>{v}</option>
                  ))}
                </select>
                <input 
                  type="text" 
                  className="input-field" 
                  placeholder={t('searchFarmerName', language)} 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{ flex: 1 }}
                />
              </div>

              {/* Farmer Checklist */}
              <div className="glass-card" style={{ padding: '0.5rem', maxHeight: '180px', overflowY: 'auto', background: 'rgba(255,255,255,0.01)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.25rem 0.5rem', borderBottom: '1px solid var(--border-glass)', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{t('showingFarmers', language)} {filteredFarmers.length}</span>
                  <button 
                    type="button" 
                    onClick={() => handleSelectAllFiltered(filteredFarmers)} 
                    style={{ background: 'transparent', border: 'none', color: 'var(--accent-primary)', fontSize: '0.8rem', cursor: 'pointer', fontWeight: 'bold' }}
                  >
                    {t('selectAll', language)}
                  </button>
                </div>
                {filteredFarmers.map(f => (
                  <label key={f.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.35rem 0.5rem', cursor: 'pointer', transition: 'var(--transition-smooth)' }} className="table-row-hover">
                    <input 
                      type="checkbox" 
                      checked={selectedFarmerIds.includes(f.id)} 
                      onChange={() => handleFarmerCheckboxChange(f.id)} 
                    />
                    <div style={{ fontSize: '0.9rem' }}>
                      <span style={{ fontWeight: 'bold' }}>{f.firstName} {f.lastName}</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: '0.5rem' }}>({f.village} | {f.mobile})</span>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginTop: '2rem', borderTop: '1px solid var(--border-glass)', paddingTop: '1.5rem' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontWeight: 'bold' }}>Communication Mode</label>
                <select 
                  className="input-field" 
                  value={commMode} 
                  onChange={(e) => setCommMode(e.target.value)}
                  style={{ background: '#121b16', width: '100%' }}
                >
                  <option value="UNIVERSAL">Broadcast via Universal Number (Auto)</option>
                  <option value="PERSONAL_WHATSAPP">Personal WhatsApp (Manual)</option>
                  <option value="PERSONAL_SMS">Personal SMS / Text Message (Manual)</option>
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  {t('recipientsSelected', language)}: <span style={{ color: 'var(--accent-primary)', fontWeight: 'bold' }}>{selectedFarmerIds.length}</span>
                </div>
                <button type="submit" className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Send size={16} />
                  <span>
                    {commMode === 'PERSONAL_WHATSAPP' 
                      ? 'Start Personal WhatsApp' 
                      : commMode === 'PERSONAL_SMS' 
                      ? 'Start Personal SMS' 
                      : t('dispatchBroadcast', language)}
                  </span>
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Right Side: Log History */}
        <div className="glass-panel" style={{ padding: '2rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: '1.3rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Bell size={20} style={{ color: 'var(--accent-primary)' }} />
                <span>{t('communicationLogs', language)}</span>
              </h2>
              <input 
                type="text" 
                className="input-field" 
                placeholder="Search logs..." 
                value={historySearch} 
                onChange={(e) => setHistorySearch(e.target.value)} 
                style={{ maxWidth: '140px', padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
              />
            </div>
            
            {/* Grouping Toggle Tabs */}
            <div style={{ display: 'flex', gap: '0.35rem', background: 'rgba(255,255,255,0.02)', padding: '0.2rem', borderRadius: '8px', border: '1px solid var(--border-glass)' }}>
              {[
                { id: 'CHRONOLOGICAL', label: t('recentLogs', language) },
                { id: 'CHANNEL', label: t('byChannel', language) },
                { id: 'TYPE', label: t('byContentType', language) }
              ].map(opt => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setGroupMode(opt.id)}
                  style={{
                    flex: 1,
                    background: groupMode === opt.id ? 'var(--accent-primary)' : 'transparent',
                    color: groupMode === opt.id ? '#ffffff' : 'var(--text-secondary)',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '0.35rem 0',
                    fontSize: '0.75rem',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    transition: 'var(--transition-smooth)'
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxHeight: '520px', overflowY: 'auto' }}>
            {groupedLogs.length > 0 ? (
              groupedLogs.map(group => (
                <div key={group.title}>
                  <div style={{ fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--accent-secondary)', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-glass)', marginBottom: '0.75rem', display: 'flex', justifyContent: 'space-between' }}>
                    <span>{group.title}</span>
                    <span style={{ opacity: 0.6 }}>({group.logs.length})</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {group.logs.map(log => {
                      const dateStr = new Date(log.sentAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
                      return (
                        <div key={log.id} className="glass-card" style={{ padding: '1rem', background: 'rgba(255,255,255,0.01)', position: 'relative' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                            <span style={{ fontWeight: 'bold', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                              {getChannelIcon(log.channel)}
                              <span>{log.recipientName}</span>
                            </span>
                            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                              <Clock size={10} />
                              <span>{dateStr}</span>
                            </span>
                          </div>

                          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                            <span style={{ fontSize: '0.65rem', background: 'rgba(245,158,11,0.15)', color: '#fbbf24', padding: '0.1rem 0.4rem', borderRadius: '4px', fontWeight: 'bold' }}>
                              {log.channel}
                            </span>
                            <span style={{ fontSize: '0.65rem', background: log.status === 'SENT' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)', color: log.status === 'SENT' ? 'var(--success)' : 'var(--error)', padding: '0.1rem 0.4rem', borderRadius: '4px', fontWeight: 'bold' }}>
                              {log.status}
                            </span>
                          </div>

                          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', whiteSpace: 'pre-line', marginBottom: '0.75rem' }}>{log.message}</p>

                          {(() => {
                            const targetFarmer = farmers.find(f => {
                              const fName = `${f.firstName} ${f.lastName}`.trim().toLowerCase();
                              const logName = log.recipientName.trim().toLowerCase();
                              return fName === logName || logName.includes(fName) || fName.includes(logName);
                            });

                            const handleSendPersonalWhatsApp = (e, message) => {
                              e.preventDefault();
                              let phone = '';
                              if (targetFarmer) {
                                phone = targetFarmer.mobile.replace(/[^0-9]/g, '');
                              } else {
                                phone = prompt("Enter farmer's mobile number (with country code, e.g., 917066935070):", "91");
                                if (!phone) return;
                                phone = phone.replace(/[^0-9]/g, '');
                              }
                              const formattedPhone = phone.length === 10 ? '91' + phone : phone;
                              window.open(`https://api.whatsapp.com/send?phone=${formattedPhone}&text=${encodeURIComponent(message)}`, '_blank');
                            };

                            const handleSendPersonalSMS = (e, message) => {
                              e.preventDefault();
                              let phone = '';
                              if (targetFarmer) {
                                phone = targetFarmer.mobile.replace(/[^0-9]/g, '');
                              } else {
                                phone = prompt("Enter farmer's mobile number:", "");
                                if (!phone) return;
                                phone = phone.replace(/[^0-9]/g, '');
                              }
                              const formattedPhone = phone.length === 10 ? '91' + phone : phone;
                              window.location.href = `sms:${formattedPhone}?body=${encodeURIComponent(message)}`;
                            };

                            const handleSendPersonalEmail = (e, message) => {
                              e.preventDefault();
                              let email = '';
                              if (targetFarmer && targetFarmer.email) {
                                email = targetFarmer.email;
                              } else {
                                email = prompt("Enter farmer's email address:", "");
                                if (!email) return;
                              }
                              window.location.href = `mailto:${email}?subject=Notification from ${user?.businessName || 'AgriSuite'}&body=${encodeURIComponent(message)}`;
                            };

                            return (
                              <div style={{ display: 'flex', gap: '0.5rem', borderTop: '1px solid var(--border-glass)', paddingTop: '0.5rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                                {log.channel === 'WHATSAPP' && (
                                  <button 
                                    onClick={(e) => handleSendPersonalWhatsApp(e, log.message)}
                                    className="btn btn-secondary"
                                    style={{ padding: '0.25rem 0.5rem', fontSize: '0.7rem', display: 'inline-flex', gap: '0.25rem', alignItems: 'center', borderColor: '#22c55e', background: 'rgba(34, 197, 94, 0.05)', color: '#ffffff', cursor: 'pointer', border: '1px solid' }}
                                  >
                                    <MessageSquare size={12} style={{ color: '#22c55e' }} />
                                    <span>Send via Personal WhatsApp</span>
                                  </button>
                                )}
                                {log.channel === 'SMS' && (
                                  <button 
                                    onClick={(e) => handleSendPersonalSMS(e, log.message)}
                                    className="btn btn-secondary"
                                    style={{ padding: '0.25rem 0.5rem', fontSize: '0.7rem', display: 'inline-flex', gap: '0.25rem', alignItems: 'center', borderColor: '#fbbf24', background: 'rgba(251, 191, 36, 0.05)', color: '#ffffff', cursor: 'pointer', border: '1px solid' }}
                                  >
                                    <Phone size={12} style={{ color: '#fbbf24' }} />
                                    <span>Send via Device SMS</span>
                                  </button>
                                )}
                                {log.channel === 'EMAIL' && (
                                  <button 
                                    onClick={(e) => handleSendPersonalEmail(e, log.message)}
                                    className="btn btn-secondary"
                                    style={{ padding: '0.25rem 0.5rem', fontSize: '0.7rem', display: 'inline-flex', gap: '0.25rem', alignItems: 'center', borderColor: '#3b82f6', background: 'rgba(59, 130, 246, 0.05)', color: '#ffffff', cursor: 'pointer', border: '1px solid' }}
                                  >
                                    <Mail size={12} style={{ color: '#3b82f6' }} />
                                    <span>Send via Personal Email</span>
                                  </button>
                                )}
                              </div>
                            );
                          })()}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))
            ) : (
              <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                No communication events logged.
              </div>
            )}
          </div>
        </div>

      </div>

      {showQueueModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.85)',
          zIndex: 9999,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          backdropFilter: 'blur(8px)'
        }}>
          <div className="glass-panel" style={{
            padding: '2.5rem',
            width: '100%',
            maxWidth: '500px',
            background: 'var(--bg-glass-heavy)',
            border: '1px solid var(--border-glass)',
            borderRadius: '16px'
          }}>
            <h3 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '1rem', color: '#ffffff' }}>
              {commMode === 'PERSONAL_SMS' ? 'Personal SMS Dispatcher' : 'Personal WhatsApp Dispatcher'}
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
              {commMode === 'PERSONAL_SMS' 
                ? 'To bypass browser popup blockers, please click the send button for each farmer below to open your device SMS app with the pre-filled text.' 
                : 'To bypass browser popup blockers, please click the send button for each farmer below. WhatsApp Web will open with the pre-filled message.'}
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '300px', overflowY: 'auto', marginBottom: '2rem' }}>
              {personalWhatsAppQueue.map(f => {
                const cleanPhone = f.mobile.replace(/[^0-9]/g, '');
                const formattedPhone = cleanPhone.length === 10 ? '91' + cleanPhone : cleanPhone;
                const resolvedText = resolveUIPlaceholders(messageText, [f.id]);
                const isSent = queueSentMap[f.id];

                return (
                  <div key={f.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid var(--border-glass)' }}>
                    <div>
                      <div style={{ fontWeight: 'bold', fontSize: '0.9rem', color: isSent ? 'var(--text-muted)' : '#ffffff', textDecoration: isSent ? 'line-through' : 'none' }}>
                        {f.firstName} {f.lastName}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {f.mobile}
                      </div>
                    </div>

                    <a
                      href={commMode === 'PERSONAL_SMS' 
                        ? `sms:${f.mobile}?body=${encodeURIComponent(resolvedText)}`
                        : `https://api.whatsapp.com/send?phone=${formattedPhone}&text=${encodeURIComponent(resolvedText)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => setQueueSentMap(prev => ({ ...prev, [f.id]: true }))}
                      className="btn btn-secondary"
                      style={{
                        padding: '0.35rem 0.75rem',
                        fontSize: '0.75rem',
                        display: 'inline-flex',
                        gap: '0.25rem',
                        alignItems: 'center',
                        borderColor: isSent ? 'var(--text-muted)' : commMode === 'PERSONAL_SMS' ? '#fbbf24' : '#22c55e',
                        background: isSent ? 'rgba(255,255,255,0.01)' : commMode === 'PERSONAL_SMS' ? 'rgba(251, 191, 36, 0.05)' : 'rgba(34, 197, 94, 0.05)',
                        color: isSent ? 'var(--text-muted)' : '#ffffff',
                        border: '1px solid'
                      }}
                    >
                      <MessageSquare size={12} style={{ color: isSent ? 'var(--text-muted)' : commMode === 'PERSONAL_SMS' ? '#fbbf24' : '#22c55e' }} />
                      <span>{isSent ? 'Sent (Reopen)' : commMode === 'PERSONAL_SMS' ? 'Send SMS' : 'Send WhatsApp'}</span>
                    </a>
                  </div>
                );
              })}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
              <button 
                type="button" 
                onClick={() => {
                  setShowQueueModal(false);
                  setQueueSentMap({});
                  setMessageText('');
                  setSelectedFarmerIds([]);
                  fetchNotificationLogs();
                }}
                className="btn btn-primary"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
