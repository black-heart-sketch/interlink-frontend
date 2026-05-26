function ScreenHeader({ item, title, description, action }) {
  return (
    <section className="dashboard-screen-header" style={{ '--item-accent': item.accent }}>
      <div className="dashboard-screen-title-row">
        <div>
          <h2>{title}</h2>
          {description && <p>{description}</p>}
        </div>
        <button type="button">{action || 'New'}</button>
      </div>
    </section>
  );
}

export default ScreenHeader;
