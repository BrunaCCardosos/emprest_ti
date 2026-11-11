BEGIN;

INSERT INTO public.tenants (id, slug, name, updated_at)
VALUES (gen_random_uuid(), 'suporte_ti', 'Suporte de TI', CURRENT_TIMESTAMP)
ON CONFLICT (slug) DO NOTHING;

-- Serializa execuções da carga do mesmo tenant.
DO $$
BEGIN
    PERFORM id FROM public.tenants WHERE slug = 'suporte_ti' FOR UPDATE;
END;
$$;

WITH expected (patrimony, name, category, status) AS (
    VALUES
        ('TI-0001', 'Notebook 14 polegadas', 'NOTEBOOK', 'AVAILABLE'),
        ('TI-0002', 'Notebook 15 polegadas', 'NOTEBOOK', 'AVAILABLE'),
        ('TI-0003', 'Notebook 13 polegadas', 'NOTEBOOK', 'AVAILABLE'),
        ('TI-0004', 'Notebook 15 polegadas', 'NOTEBOOK', 'MAINTENANCE'),
        ('TI-0005', 'Monitor 24 polegadas', 'MONITOR', 'AVAILABLE'),
        ('TI-0006', 'Monitor 27 polegadas', 'MONITOR', 'AVAILABLE'),
        ('TI-0007', 'Monitor 22 polegadas', 'MONITOR', 'MAINTENANCE'),
        ('TI-0008', 'Cabo HDMI 2 m', 'CABLE', 'AVAILABLE'),
        ('TI-0009', 'Cabo USB-C 1 m', 'CABLE', 'AVAILABLE'),
        ('TI-0010', 'Cabo de rede 3 m', 'CABLE', 'MAINTENANCE'),
        ('TI-0011', 'Webcam Full HD', 'CAMERA', 'AVAILABLE'),
        ('TI-0012', 'Câmera compacta', 'CAMERA', 'AVAILABLE')
), target AS (
    SELECT t.id AS tenant_id, e.*,
           t.slug || '/' || e.patrimony || '.jpg' AS photo_path
    FROM public.tenants AS t
    CROSS JOIN expected AS e
    WHERE t.slug = 'suporte_ti'
), saved AS (
    INSERT INTO public.equipments AS current_item
        (id, tenant_id, patrimony, name, category, status, photo_path, updated_at)
    SELECT gen_random_uuid(), tenant_id, patrimony, name,
           category::public.equipment_category, status::public.equipment_status,
           photo_path, CURRENT_TIMESTAMP
    FROM target
    ON CONFLICT (tenant_id, patrimony) DO UPDATE
        SET photo_path = EXCLUDED.photo_path, updated_at = CURRENT_TIMESTAMP
        WHERE current_item.photo_path IS NULL
          AND current_item.name = EXCLUDED.name
          AND current_item.category = EXCLUDED.category
          AND current_item.status = EXCLUDED.status
    RETURNING patrimony
)
SELECT target.patrimony,
       CASE
           WHEN saved.patrimony IS NOT NULL AND existing.id IS NULL THEN 'criado'
           WHEN saved.patrimony IS NOT NULL THEN 'foto preenchida'
           WHEN existing.name = target.name
             AND existing.category::text = target.category
             AND existing.status::text = target.status
             AND existing.photo_path = target.photo_path THEN 'já conferido'
           ELSE 'divergência preservada'
       END AS resultado
FROM target
LEFT JOIN saved ON saved.patrimony = target.patrimony
LEFT JOIN public.equipments AS existing
    ON existing.tenant_id = target.tenant_id AND existing.patrimony = target.patrimony
ORDER BY target.patrimony;

COMMIT;
