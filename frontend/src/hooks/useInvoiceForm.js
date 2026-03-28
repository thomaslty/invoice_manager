import { useState, useCallback } from 'react';

function newItem() {
  return { id: crypto.randomUUID(), description: '', qty: 1, total: 0 };
}

/** Ensure every item in every category has a stable unique ID. */
function ensureItemIds(data) {
  const cats = data?.sections?.items?.categories;
  if (!cats) return data;
  let changed = false;
  const patched = cats.map(cat => {
    const items = cat.items?.map(item => {
      if (item.id) return item;
      changed = true;
      return { ...item, id: crypto.randomUUID() };
    });
    return items ? { ...cat, items } : cat;
  });
  if (!changed) return data;
  return { ...data, sections: { ...data.sections, items: { ...data.sections.items, categories: patched } } };
}

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
      currency: 'HKD',
      categories: [
        {
          name: '',
          items: [newItem()],
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
  const [formData, _setFormData] = useState(initialData || defaultFormData);
  const [fontId, setFontId] = useState(null);

  const setFormData = useCallback((dataOrFn) => {
    if (typeof dataOrFn === 'function') {
      _setFormData(prev => ensureItemIds(dataOrFn(prev)));
    } else {
      _setFormData(ensureItemIds(dataOrFn));
    }
  }, []);

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
              { name: '', items: [newItem()] },
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
              : [{ name: '', items: [newItem()] }],
          },
        },
      };
    });
  }, []);

  const addItem = useCallback((catIndex) => {
    setFormData(prev => {
      const cats = [...prev.sections.items.categories];
      cats[catIndex] = {
        ...cats[catIndex],
        items: [...cats[catIndex].items, newItem()],
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
        items: items.length ? items : [newItem()],
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

  const reorderItem = useCallback((catIndex, fromIndex, toIndex) => {
    setFormData(prev => {
      const cats = [...prev.sections.items.categories];
      const items = [...cats[catIndex].items];
      const [moved] = items.splice(fromIndex, 1);
      items.splice(toIndex, 0, moved);
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
    reorderItem,
    setCurrency,
    grandTotal,
  };
}
