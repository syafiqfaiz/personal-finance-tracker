# Feasibility Study: Cloudflare R2 vs. AWS S3
**Date:** 2026-01-27
**Context:** Personal Finance Tracker (Cloudflare Pages + Functions)

## Executive Summary

For the "Personal Finance Tracker" hosted on Cloudflare Pages, **Cloudflare R2 is the superior choice**.

*   **Cost**: R2 is significantly cheaper, primarily due to **zero egress fees** and a generous perpetual free tier.
*   **Integration**: R2 allows "Native Bindings" in Cloudflare Pages Functions, eliminating the need for AWS SDKs, authentication secrets, and network latency configuration.
*   **Performance**: Native bindings avoid HTTP overhead for internal requests within the Cloudflare network.

**Recommendation:** Proceed with Cloudflare R2.

---

## 1. Feature Comparison

| Feature | Cloudflare R2 | AWS S3 Standard |
| :--- | :--- | :--- |
| **Egress (Data Transfer Out)** | **$0 / GB** (Free) | ~$0.09 / GB |
| **Storage Cost** | $0.015 / GB-month | $0.023 / GB-month |
| **Class A Ops (PUT/Writes)** | $4.50 / million | $5.00 / million |
| **Class B Ops (GET/Reads)** | $0.36 / million | $0.40 / million |
| **Free Tier** | **10 GB** Storage<br>**1M** Writes / mo<br>**10M** Reads / mo<br>(Perpetual) | **5 GB** Storage<br>**2,000** Writes<br>**20,000** Reads<br>(12 Months Only) |
| **Integration** | Native Binding (import object directly) | HTTP REST API (requires AWS SDK) |
| **Latency** | Near-zero (running on same metal) | Low (but outside network) |

## 2. Integration Feasibility

Since the application is hosted on Cloudflare Pages (evident from `wrangler.toml` and `functions/` directory):

*   **Setup**: Requires only adding `[[r2_buckets]]` to `wrangler.toml`.
*   **Security**: No need to manage Access Key ID / Secret Access Key. IAM is handled by the platform.
*   **Code**:
    *   *AWS S3 Style*: `await s3Client.send(new PutObjectCommand({...}))` (Requires `aws-sdk`)
    *   *R2 Native Style*: `await env.MY_BUCKET.put(key, stream)` (Zero dependencies)

## 3. Cost Simulation & Break-even Analysis

The user asked: *"At what point do I need to start paying?"*

**You pay NOTHING until you exceed one of these monthly limits:**
1.  **Storage**: More than **10 GB** stored.
2.  **Writes (Uploads)**: More than **1,000,000** files uploaded per month.
3.  **Reads (Downloads)**: More than **10,000,000** files downloaded per month.

### Scenario A: Personal Use (Free Tier)
*Assumption: 1 User, 5GB data, 100 uploads/day, 1000 views/day.*

*   **Storage**: 5 GB (< 10 GB limit)
*   **Writes**: 3,000 / mo (< 1M limit)
*   **Reads**: 30,000 / mo (< 10M limit)
*   **Egress**: ~5 GB / mo

| Service | Monthly Bill | Notes |
| :--- | :--- | :--- |
| **Cloudflare R2** | **$0.00** | Well within free limits. |
| **AWS S3** | **~$0.60*** | *Free for first 12 months, then pays ~$0.60/mo (mostly egress).* |

### Scenario B: The "Break-even" Point (Usage = R2 Free Tier Limit)
*Assumption: You use exactly the max of R2's free tier.*
*Usage: 10 GB Storage, 1M Uploads, 10M Downloads, 100GB Egress.*

| Service | Monthly Bill | Calculation |
| :--- | :--- | :--- |
| **Cloudflare R2** | **$0.00** | Maxed out free tier. |
| **AWS S3** | **~$19.23** | Storage ($0.23) + Writes ($5.00) + Reads ($4.00) + Egress ($10.00) |

**Insight**: The "Free Tier" of R2 provides value equivalent to ~$19/month of AWS S3 usage.

### Scenario C: Moderate Growth (Paying Customer)
*Assumption: Project grows to 1TB storage, heavy usage.*
*Usage: 1 TB Storage, 5M Uploads, 50M Downloads, 2 TB Egress.*

| Cost Component | Cloudflare R2 Cost | AWS S3 Cost |
| :--- | :--- | :--- |
| **Storage** (1 TB) | $15.21 | $23.55 |
| **Writes** (5M) | $18.00 | $25.00 |
| **Reads** (50M) | $14.40 | $20.00 |
| **Egress** (2 TB) | **$0.00** | **$184.32** |
| **TOTAL** | **~$47.61** | **~$252.87** |

## Conclusion

For the Personal Finance Tracker:
1.  **Start with R2**. It is unlikely you will ever pay a cent for personal use.
2.  **Zero Egress Fees** future-proofs you against high bills if you ever share data or assets publicly.
3.  **Simplicity**: Native integration is cleaner than configuring AWS IAM and SDKs.

### Next Steps (Implementation)
1.  Add R2 Bucket binding to `wrangler.toml`.
2.  Create the bucket via `wrangler r2 bucket create`.
3.  Update codebase to use the binding.
