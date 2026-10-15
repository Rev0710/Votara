import "./VotaraLoadingIntro.css";

export default function VotaraLoadingIntro() {
  return (
    
    <main className="votara-intro-screen" role="status" aria-live="polite" aria-label="Loading Votara">
      <div className="votara-intro-content">
        <div className="votara-intro-orbit" aria-hidden="true">
          <div className="votara-intro-orbit-inner">
            <span className="votara-intro-triangle votara-intro-triangle-top" />
            <span className="votara-intro-circle votara-intro-circle-top" />
            <span className="votara-intro-circle votara-intro-circle-bottom" />
            <span className="votara-intro-triangle votara-intro-triangle-bottom" />
          </div>
        </div>
        <h1 className="votara-intro-title">Votara</h1>
        <p className="votara-intro-label">LOADING</p>
        <div className="votara-intro-dots" aria-hidden="true"><span /><span /><span /></div>
      </div>
    </main>
  );
}
