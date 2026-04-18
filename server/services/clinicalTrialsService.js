const axios = require('axios');

const CT_BASE = 'https://clinicaltrials.gov/api/v2';

/**
 * Search ClinicalTrials.gov for relevant clinical trials.
 */
async function searchClinicalTrials(query, limit = 50) {
  try {
    const res = await axios.get(`${CT_BASE}/studies`, {
      params: {
        'query.term': query,
        pageSize: Math.min(limit, 100),
        sort: 'LastUpdatePostDate:desc',
        fields: [
          'NCTId',
          'BriefTitle',
          'OfficialTitle',
          'BriefSummary',
          'OverallStatus',
          'StartDate',
          'Phase',
          'EnrollmentCount',
          'EligibilityCriteria',
          'LocationCity',
          'LocationState',
          'LocationCountry',
          'LocationFacility',
          'CentralContactName',
          'CentralContactPhone',
          'CentralContactEMail',
          'Condition',
          'InterventionName'
        ].join(',')
      },
      timeout: 15000
    });

    const studies = res.data?.studies || [];

    return studies.map(study => {
      const proto = study.protocolSection || {};
      const ident = proto.identificationModule || {};
      const status = proto.statusModule || {};
      const desc = proto.descriptionModule || {};
      const eligibility = proto.eligibilityModule || {};
      const contacts = proto.contactsLocationsModule || {};
      const conditions = proto.conditionsModule || {};
      const interventions = proto.armsInterventionsModule || {};
      const design = proto.designModule || {};

      // Extract locations
      const locations = (contacts.locations || []).slice(0, 3).map(loc => {
        const parts = [loc.facility, loc.city, loc.state, loc.country].filter(Boolean);
        return parts.join(', ');
      });

      // Extract central contacts
      const centralContacts = (contacts.centralContacts || []).slice(0, 2).map(c => ({
        name: c.name || '',
        phone: c.phone || '',
        email: c.email || ''
      }));

      // Extract condition names
      const conditionList = conditions.conditions || [];

      // Extract intervention names
      const interventionList = (interventions.interventions || []).map(i => i.name).filter(Boolean);

      return {
        type: 'clinical_trial',
        nctId: ident.nctId || '',
        title: ident.briefTitle || ident.officialTitle || 'Untitled Study',
        summary: (desc.briefSummary || '').slice(0, 500) + ((desc.briefSummary || '').length > 500 ? '...' : ''),
        status: status.overallStatus || 'Unknown',
        phase: (design.phases || []).join(', ') || 'N/A',
        enrollment: design.enrollmentInfo?.count || null,
        startDate: status.startDateStruct?.date || '',
        eligibility: (eligibility.eligibilityCriteria || '').slice(0, 400) + ((eligibility.eligibilityCriteria || '').length > 400 ? '...' : ''),
        conditions: conditionList,
        interventions: interventionList,
        locations,
        contacts: centralContacts,
        url: ident.nctId ? `https://clinicaltrials.gov/study/${ident.nctId}` : '',
        provider: 'ClinicalTrials.gov'
      };
    });
  } catch (err) {
    console.error('ClinicalTrials.gov search error:', err.message);
    return [];
  }
}

module.exports = { searchClinicalTrials };
