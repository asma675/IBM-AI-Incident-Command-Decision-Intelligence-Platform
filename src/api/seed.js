import { db } from "./localDb";

// Seed the app with realistic starter data so the UI isn't empty on first load.
// This runs in the browser only (localStorage-backed); during build/SSR the db
// is in-memory and will reseed on runtime.
export function ensureSeeded() {
  const seeded = db.getMeta("seeded");
  if (seeded) return;

  const now = Date.now();
  const ago = (hours) => new Date(now - hours * 60 * 60 * 1000).toISOString();

  // Incidents are shaped to match the UI screenshots:
  // - 3 active incidents
  // - 1 awaiting approval
  // - total incidents = 4
  // - systems at risk = 9, healthy = 2 (derived from affected_systems)
  const seedIncidents = [
    {
      id: "inc_001",
      created_date: ago(26),
      title: "Database Connection Pool Exhaustion - Production",
      description:
        "Multiple microservices reporting connection timeouts to PostgreSQL cluster. Error rate spiking to 23% on checkout API. Customer-facing impact detected.",
      severity: "critical",
      status: "awaiting_approval",
      source: "Datadog",
      affected_systems: ["PostgreSQL Primary", "Checkout API", "Payment Service", "Order Service"],
      assigned_to: "SRE On-Call",
      ai_analysis: {
        confidence_score: 0.76,
        summary:
          "Critical impact detected. Symptoms strongly indicate database connection pool saturation causing upstream request failures across checkout/payment workloads.",
      },
    },
    {
      id: "inc_002",
      created_date: ago(24),
      title: "AWS us-east-1 API Gateway Latency Degradation",
      description:
        "P99 latency increased from 120ms to 2.3s on primary API gateway. Regional failover consideration required.",
      severity: "high",
      status: "new",
      source: "CloudWatch",
      affected_systems: ["API Gateway", "Lambda Functions", "DynamoDB"],
      assigned_to: "Cloud Platform",
      ai_analysis: {
        confidence_score: 0.71,
        summary:
          "Elevated gateway latency suggests upstream dependency or regional capacity degradation. Prioritize mitigation and confirm whether retries are amplifying load.",
      },
    },
    {
      id: "inc_003",
      created_date: ago(22),
      title: "Memory Leak in Authentication Service",
      description:
        "Gradual memory increase over 72 hours leading to OOM kills. Pod restarts every 4-6 hours.",
      severity: "medium",
      status: "in_progress",
      source: "Prometheus",
      affected_systems: ["Auth Service", "Kubernetes Cluster"],
      assigned_to: "Identity & Access",
      ai_analysis: {
        confidence_score: 0.75,
        summary:
          "Consistent memory growth pattern points to a leak. Mitigate with resource limits and restart strategy while investigating recent code paths and allocations.",
      },
    },
    {
      id: "inc_004",
      created_date: ago(48),
      title: "SSL Certificate Expiration Warning - Edge",
      description:
        "TLS certificate approaching expiration on edge endpoints. No customer impact yet; renew before expiry to avoid outages.",
      severity: "low",
      status: "resolved",
      source: "Security Scanner",
      affected_systems: ["Load Balancer", "CDN"],
      resolved_at: ago(40),
      resolution_notes: "Renewed certificate and validated chain across edge points-of-presence.",
      assigned_to: "Security Ops",
      ai_analysis: {
        confidence_score: 0.74,
        summary:
          "Preventative action taken. Certificate renewal completed; monitoring confirms stable edge handshake success rates.",
      },
    },
  ];

  const seedArticles = [
    {
      id: "kb_001",
      created_date: ago(120),
      title: "Runbook: Troubleshoot SSO callback failures",
      summary: "Steps to diagnose auth callback 5xx, token validation errors, and certificate/clock skew issues.",
      content: "## Checklist\n- Verify IdP status\n- Check token validation logs\n- Confirm certificate chain and time sync\n\n## Rollback\n- Revert recent auth config\n",
      tags: ["auth", "sso", "identity"],
      category: "runbook",
      status: "published",
    },
    {
      id: "kb_002",
      created_date: ago(200),
      title: "Runbook: Payments API latency and DB saturation",
      summary: "DB connection pool, slow queries, and cache strategies for checkout stability.",
      content: "## Signals\n- Connection pool saturation\n- Query timeouts\n\n## Mitigations\n- Increase pool cautiously\n- Enable read replica\n",
      tags: ["payments", "database", "latency"],
      category: "runbook",
      status: "published",
    },
  ];

  // Write directly into db tables while preserving db helpers.
  const dump = db._unsafeDump();
  dump.tables.Incident = seedIncidents;
  dump.tables.KnowledgeBaseArticle = seedArticles;
  dump.tables.AuditLog = [
    {
      id: "log_001",
      created_date: ago(26),
      updated_date: ago(26),
      incident_id: "inc_001",
      action_type: "incident_created",
      actor: "demo.user@example.com",
      details: { severity: "critical", source: "Datadog" },
    },
    {
      id: "log_002",
      created_date: ago(24),
      updated_date: ago(24),
      incident_id: "inc_002",
      action_type: "incident_created",
      actor: "demo.user@example.com",
      details: { severity: "high", source: "CloudWatch" },
    },
    {
      id: "log_003",
      created_date: ago(22),
      updated_date: ago(22),
      incident_id: "inc_003",
      action_type: "incident_created",
      actor: "demo.user@example.com",
      details: { severity: "medium", source: "Prometheus" },
    },
  ];
  dump.tables.Decision = [
    {
      id: "dec_001",
      created_date: ago(18),
      updated_date: ago(18),
      incident_id: "inc_001",
      recommendation_action: "Implement LRU eviction policy for cache layer",
      decision: "approved",
      decided_by: "sre@company.com",
      decided_at: ago(18),
      decision_reason: "Agreed with AI analysis. Cache growth contributes to pressure during peak traffic.",
    },
    {
      id: "dec_002",
      created_date: ago(12),
      updated_date: ago(12),
      incident_id: "inc_004",
      recommendation_action: "Manually renew SSL certificate",
      decision: "approved",
      decided_by: "devops@company.com",
      decided_at: ago(12),
      decision_reason: "Certificate expiration is a P1 risk. Proceeding with renewal and validation.",
    },
  ];
  // 9 active predictive alerts: 2 critical (>=70%), 7 medium/high.
  dump.tables.PredictiveAlert = [
    {
      id: "pa_001",
      created_date: ago(3),
      updated_date: ago(3),
      severity: "critical",
      likelihood: 0.82,
      predicted_timeframe: "within 48-72 hours",
      predicted_issue: "PostgreSQL Connection Pool Exhaustion During Peak Hours",
      description:
        "Historical pattern shows database connection pool saturation occurring every 2-3 weeks during high-traffic periods. With Black Friday approaching, risk of critical outage is elevated.",
      affected_systems: ["PostgreSQL Primary", "Checkout API", "Payment Service", "Order Service"],
      confidence_score: 0.82,
      contributing_factors: ["Traffic surges", "Connection pool near limit", "Slow queries under load"],
      preventative_actions: ["Increase pool cautiously", "Enable query sampling", "Prepare rollback/runbook"],
      status: "active",
    },
    {
      id: "pa_002",
      created_date: ago(3),
      updated_date: ago(3),
      severity: "high",
      likelihood: 0.76,
      predicted_timeframe: "within 3-5 days",
      predicted_issue: "Authentication Service Memory Leak Leading to OOM Crash",
      description:
        "Auth Service shows consistent memory growth pattern over 72-hour periods. Based on current trajectory, next OOM crash predicted during business hours affecting user logins.",
      affected_systems: ["Auth Service", "Kubernetes Cluster", "User Session Management"],
      confidence_score: 0.76,
      contributing_factors: ["Increasing heap usage", "Frequent pod restarts", "Peak login hours"],
      preventative_actions: ["Enable heap profiling", "Tighten resource limits", "Roll forward fix"],
      status: "active",
    },
    {
      id: "pa_003",
      created_date: ago(3),
      updated_date: ago(3),
      severity: "critical",
      likelihood: 0.70,
      predicted_timeframe: "within 3-5 days",
      predicted_issue: "Database Connection Failure",
      description:
        "Given the recent critical incident of connection pool exhaustion on PostgreSQL, there is a heightened risk of complete connection failure due to recurring traffic patterns and resource exhaustion.",
      affected_systems: ["PostgreSQL Primary", "Checkout API", "Payment Service", "Order Service"],
      confidence_score: 0.75,
      contributing_factors: ["Recurring high traffic", "Pool exhaustion", "Backpressure missing"],
      preventative_actions: ["Add alerting for pool saturation", "Review query plans", "Scale read replicas"],
      status: "active",
    },
    {
      id: "pa_004",
      created_date: ago(2),
      updated_date: ago(2),
      severity: "high",
      likelihood: 0.68,
      predicted_timeframe: "within 12-24 hours",
      predicted_issue: "Lambda Cold Start Cascade During Regional AWS Outage",
      description:
        "AWS us-east-1 showing elevated error rates. If degradation continues, cold start amplification could cause 5-10 minute API unavailability affecting all services.",
      affected_systems: ["API Gateway", "Lambda Functions", "DynamoDB", "CloudFront"],
      confidence_score: 0.68,
      contributing_factors: ["Regional error rates", "Concurrency spikes", "Retry storms"],
      preventative_actions: ["Pre-warm critical functions", "Set reserved concurrency", "Enable multi-region failover"],
      status: "active",
    },
    {
      id: "pa_005",
      created_date: ago(2),
      updated_date: ago(2),
      severity: "high",
      likelihood: 0.75,
      predicted_timeframe: "3-5 days",
      predicted_issue: "Increased Latency in API Gateway",
      description:
        "Recent latency degradation hints at an ongoing issue which may escalate during peak usage. If left unaddressed, increased traffic could exacerbate latency further.",
      affected_systems: ["API Gateway", "Lambda Functions", "DynamoDB"],
      confidence_score: 0.75,
      contributing_factors: ["Traffic growth", "Regional contention", "Upstream dependency"],
      preventative_actions: ["Enable caching", "Tune timeouts", "Deploy regional failover"],
      status: "active",
    },
    {
      id: "pa_006",
      created_date: ago(2),
      updated_date: ago(2),
      severity: "high",
      likelihood: 0.70,
      predicted_timeframe: "within 3-5 days",
      predicted_issue: "Increased Latency in API Gateway",
      description:
        "Ongoing gateway degradation could worsen if retries and bursts continue. Monitor p99 and error rate trends closely.",
      affected_systems: ["API Gateway", "Lambda Functions", "DynamoDB"],
      confidence_score: 0.70,
      contributing_factors: ["Retry amplification", "Burst traffic", "Timeout config"],
      preventative_actions: ["Rate-limit retries", "Tune circuit breakers", "Validate WAF rules"],
      status: "active",
    },
    {
      id: "pa_007",
      created_date: ago(1),
      updated_date: ago(1),
      severity: "high",
      likelihood: 0.60,
      predicted_timeframe: "within 3-5 days",
      predicted_issue: "Database Connection Pool Exhaustion Risk",
      description:
        "Following the critical incident of pool exhaustion, the issue may recur due to ongoing heavy traffic and insufficient pool size post-remediation.",
      affected_systems: ["PostgreSQL Primary", "Checkout API", "Payment Service", "Order Service"],
      confidence_score: 0.60,
      contributing_factors: ["Sustained traffic", "Pool sizing", "Slow query spikes"],
      preventative_actions: ["Increase pool", "Add query timeouts", "Improve caching"],
      status: "active",
    },
    {
      id: "pa_008",
      created_date: ago(1),
      updated_date: ago(1),
      severity: "high",
      likelihood: 0.50,
      predicted_timeframe: "within 24 hours",
      predicted_issue: "Memory Leak Continuation in Authentication Service",
      description:
        "Existing memory leak could worsen if not resolved promptly, leading to service unavailability and affecting dependent systems.",
      affected_systems: ["Auth Service", "Kubernetes Cluster"],
      confidence_score: 0.80,
      contributing_factors: ["Heap growth", "GC pressure", "Traffic peaks"],
      preventative_actions: ["Enable profiling", "Adjust limits", "Deploy patch"],
      status: "active",
    },
    {
      id: "pa_009",
      created_date: ago(1),
      updated_date: ago(1),
      severity: "high",
      likelihood: 0.50,
      predicted_timeframe: "within 7 days",
      predicted_issue: "Potential Memory Leak in Payment Services",
      description:
        "Given prior incident involving memory leaks in Auth Service, similar issues may arise in Payment Services, especially with high transaction volumes expected.",
      affected_systems: ["Payment Service", "PostgreSQL Primary", "Checkout API"],
      confidence_score: 0.68,
      contributing_factors: ["High volumes", "Gradual memory increase", "Shared libraries"],
      preventative_actions: ["Track RSS trends", "Add leak detection", "Canary release"],
      status: "active",
    },
  ];
  dump.tables.PostIncidentReview = [];
  dump.tables.IncidentAutomation = [];

  // Persist
  if (typeof window !== "undefined" && window?.localStorage) {
    window.localStorage.setItem("icdi_local_db_v1", JSON.stringify(dump));
  }
  db.setMeta("seeded", true);
}
