with open('main.css', 'a', encoding='utf-8') as f:
    f.write('''
/* ══════════ GLOBAL POLICY STRIP ══════════ */
.global-policy-strip {
  background: var(--dark2);
  color: var(--white);
  padding: 30px 0;
  border-top: 2px solid var(--gold);
}

.policy-items {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 20px;
}

.policy-item {
  display: flex;
  align-items: center;
  gap: 16px;
  flex: 1;
  min-width: 250px;
}

.policy-icon {
  font-size: 2rem;
  background: rgba(201, 168, 76, 0.1);
  padding: 15px;
  border-radius: 50%;
  border: 1px solid rgba(201, 168, 76, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--gold);
}

.policy-item h4 {
  font-family: var(--font-heading);
  font-size: 1.1rem;
  margin-bottom: 4px;
  color: var(--gold-light);
}

.policy-item p {
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.7);
}

@media (max-width: 768px) {
  .policy-items {
    flex-direction: column;
    align-items: flex-start;
  }
}
''')
