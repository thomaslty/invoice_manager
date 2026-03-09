import { useState, useCallback } from 'react';

const defaultFormData = {
  sections: {
    header: { visible: true, title: 'INVOICE' },
    metadata: {
      visible: true,
      fields: {
        date: '',
        refNo: '',
        client: '',
        contactPerson: '',
        jobTitle: '',
      },
    },
    items: {
      visible: true,
      currency: 'HK$',
      categories: [
        {
          name: '',
          items: [{ no: 1, description: '', qty: 1, total: 0 }],
        },
      ],
    },
    paymentMethod: { visible: true, content: '' },
    terms: { visible: true, content: '' },
    signature: {
      visible: true,
      label: 'For and on behalf of',
      imageUrl: '',
      name: '',
      title: '',
    },
    footer: { visible: true, content: '' },
  },
};

export function useInvoiceForm(initialData = null) {
  const [formData, setFormData] = useState(initialData || defaultFormData);
  const [fontId, setFontId] = useState(null);

  const updateSection = useCallback((sectionKey, data) => {
    setFormData(prev => ({
      ...prev,
      sections: {
        ...prev.sections,
        [sectionKey]: { ...prev.sections[sectionKey], ...data },
      },
    }));
  }, []);

  const toggleSection = useCallback((sectionKey) => {
    setFormData(prev => ({
      ...prev,
      sections: {
        ...prev.sections,
        [sectionKey]: {
          ...prev.sections[sectionKey],
          visible: !prev.sections[sectionKey].visible,
        },
      },
    }));
  }, []);

  const updateMetadataField = useCallback((field, value) => {
    setFormData(prev => ({
      ...prev,
      sections: {
        ...prev.sections,
        metadata: {
          ...prev.sections.metadata,
          fields: { ...prev.sections.metadata.fields, [field]: value },
        },
      },
    }));
  }, []);

  const addCategory = useCallback(() => {
    setFormData(prev => {
      const cats = prev.sections.items.categories;
      return {
        ...prev,
        sections: {
          ...prev.sections,
          items: {
            ...prev.sections.items,
            categories: [
              ...cats,
              { name: '', items: [{ no: 1, description: '', qty: 1, total: 0 }] },
            ],
          },
        },
      };
    });
  }, []);

  const removeCategory = useCallback((catIndex) => {
    setFormData(prev => {
      const cats = prev.sections.items.categories.filter((_, i) => i !== catIndex);
      return {
        ...prev,
        sections: {
          ...prev.sections,
          items: {
            ...prev.sections.items,
            categories: cats.length
              ? cats
              : [{ name: '', items: [{ no: 1, description: '', qty: 1, total: 0 }] }],
          },
        },
      };
    });
  }, []);

  const addItem = useCallback((catIndex) => {
    setFormData(prev => {
      const cats = [...prev.sections.items.categories];
      const items = cats[catIndex].items;
      const maxNo = items.reduce((max, item) => Math.max(max, item.no || 0), 0);
      cats[catIndex] = {
        ...cats[catIndex],
        items: [...items, { no: maxNo + 1, description: '', qty: 1, total: 0 }],
      };
      return {
        ...prev,
        sections: {
          ...prev.sections,
          items: { ...prev.sections.items, categories: cats },
        },
      };
    });
  }, []);

  const removeItem = useCallback((catIndex, itemIndex) => {
    setFormData(prev => {
      const cats = [...prev.sections.items.categories];
      const items = cats[catIndex].items.filter((_, i) => i !== itemIndex);
      cats[catIndex] = {
        ...cats[catIndex],
        items: items.length
          ? items
          : [{ no: 1, description: '', qty: 1, total: 0 }],
      };
      return {
        ...prev,
        sections: {
          ...prev.sections,
          items: { ...prev.sections.items, categories: cats },
        },
      };
    });
  }, []);

  const updateItem = useCallback((catIndex, itemIndex, field, value) => {
    setFormData(prev => {
      const cats = [...prev.sections.items.categories];
      const items = [...cats[catIndex].items];
      items[itemIndex] = { ...items[itemIndex], [field]: value };
      cats[catIndex] = { ...cats[catIndex], items };
      return {
        ...prev,
        sections: {
          ...prev.sections,
          items: { ...prev.sections.items, categories: cats },
        },
      };
    });
  }, []);

  const updateCategoryName = useCallback((catIndex, name) => {
    setFormData(prev => {
      const cats = [...prev.sections.items.categories];
      cats[catIndex] = { ...cats[catIndex], name };
      return {
        ...prev,
        sections: {
          ...prev.sections,
          items: { ...prev.sections.items, categories: cats },
        },
      };
    });
  }, []);

  const setCurrency = useCallback((currency) => {
    setFormData(prev => ({
      ...prev,
      sections: {
        ...prev.sections,
        items: { ...prev.sections.items, currency },
      },
    }));
  }, []);

  const grandTotal = formData.sections.items.categories.reduce((sum, cat) => {
    return sum + cat.items.reduce((catSum, item) => catSum + (Number(item.total) || 0), 0);
  }, 0);

  return {
    formData,
    setFormData,
    fontId,
    setFontId,
    updateSection,
    toggleSection,
    updateMetadataField,
    addCategory,
    removeCategory,
    addItem,
    removeItem,
    updateItem,
    updateCategoryName,
    setCurrency,
    grandTotal,
  };
}
