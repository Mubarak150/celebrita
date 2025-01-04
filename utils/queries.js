const getPlotsStatsQuery = `
            SELECT 
                society,
                COUNT(*) AS total_plots,
                SUM(CASE WHEN plot_size = '5 Marla' THEN 1 ELSE 0 END) AS total_5_marla,
                SUM(CASE WHEN plot_size = '10 Marla' THEN 1 ELSE 0 END) AS total_10_marla,
                SUM(CASE WHEN plot_size = '1 Kanal' THEN 1 ELSE 0 END) AS total_1_kanal
            FROM 
                plots
            GROUP BY 
                society

            UNION ALL

            SELECT 
                'Overall Totals' AS society,
                COUNT(*) AS total_plots,
                SUM(CASE WHEN plot_size = '5 Marla' THEN 1 ELSE 0 END) AS total_5_marla,
                SUM(CASE WHEN plot_size = '10 Marla' THEN 1 ELSE 0 END) AS total_10_marla,
                SUM(CASE WHEN plot_size = '1 Kanal' THEN 1 ELSE 0 END) AS total_1_kanal
            FROM 
                plots;
        `;

module.exports = {
    getPlotsStatsQuery
}